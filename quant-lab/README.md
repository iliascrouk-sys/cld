# quant-lab — laboratorio de backtesting

Herramienta para responder con honestidad a una única pregunta:
**¿esta estrategia tiene ventaja real o es ruido?**

El objetivo no es que el backtest dé buenos números. Es que los números que
dé se puedan creer. Todo el diseño está orientado a eso: cuando hay duda, el
laboratorio se para en vez de seguir adelante con datos dudosos.

> **Este código no opera con dinero real ni se conecta a ninguna cuenta.**
> Solo lee datos históricos públicos. Antes de que nada de esto toque dinero
> hacen falta, como mínimo: validación fuera de muestra (Fase 4) y un periodo
> de paper trading con resultados registrados.

## Estado

| Fase | Qué es | Estado |
|---|---|---|
| 1 | Datos: descarga, caché y validación | **hecha** |
| 2 | Motor de backtest (sin look-ahead, con costes) | pendiente |
| 3 | Métricas y comparativa contra buy & hold | pendiente |
| 4 | Defensas contra el sobreajuste | pendiente |

---

## Instalación

```bash
cd quant-lab
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Uso

Desde la terminal:

```bash
# Descargar y validar
python -m qlab.cli descargar BTC/USDT 1h --desde 2023-01-01 --hasta 2023-12-31

# Ver qué tienes guardado
python -m qlab.cli listar

# Revisar la calidad de algo que ya tienes, sin descargar nada
python -m qlab.cli revisar BTC/USDT 1h
```

Códigos de salida: `0` todo bien · `1` datos sucios · `2` error de uso o de
conexión.

Desde Python:

```python
from qlab.datos import cargar_ohlcv

datos = cargar_ohlcv("BTC/USDT", "1h", "2023-01-01", "2023-12-31")

datos.velas     # DataFrame: open, high, low, close, volume
datos.informe   # qué se ha comprobado y qué ha salido
datos.huella    # sha256 exacto de estos datos
print(datos.resumen())
```

Si los datos están sucios, `cargar_ohlcv` **lanza una excepción** con el
detalle. No devuelve datos a medias.

### Demo sin conexión

Como el laboratorio no depende de la red para funcionar, hay una demo que lo
enseña todo con un exchange simulado:

```bash
python demo_sin_red.py
```

---

## Fase 1 — cómo están hechas las cosas y por qué

### La regla que manda sobre todas: nunca rellenar en silencio

Un backtest sobre datos rellenados da una curva de resultados preciosa que no
existió jamás. Es la forma más común y más silenciosa de mentirse a uno
mismo. Por eso:

- La capa de validación **mira y se queja, nunca toca los datos**.
- Si faltan velas, el comportamiento por defecto es **fallar**.
- Hay dos alternativas, ambas explícitas y ninguna inventa datos:
  `recortar` (se queda con el tramo continuo más largo y **descarta** el
  resto, avisando por consola) y `permitir` (sigue con los huecos, dejando
  constancia de que los resultados no son fiables).

### El índice es la hora de APERTURA de la vela, en UTC

Si etiquetas las velas por su hora de cierre es facilísimo acabar usando
información del futuro. Con la apertura, la regla queda simple: la vela `t`
contiene lo que pasó entre `t` y `t+paso`, y no se conoce entera hasta
`t+paso`. UTC porque el horario de verano es una fábrica de bugs invisibles.

### La vela en formación se descarta siempre

Una vela que aún se está formando cambia de valores mientras la miras.
Usarla es mirar el futuro. Es la primera de las tres barreras contra el
look-ahead del proyecto (las otras dos van en el motor de la Fase 2). Está
comprobada por dos tests, uno en la capa de descarga y otro de punta a punta.

El reloj de referencia es **el del exchange**, no el de tu ordenador: si tu
reloj va adelantado, darías por cerrada una vela que no lo está.

### Qué se comprueba exactamente

| Comprobación | Nivel | Por qué importa |
|---|---|---|
| Estructura, tipos, zona horaria | error | Sin esto, todo lo demás es ruido |
| Tabla vacía | error | Casi siempre: símbolo o fechas mal |
| Velas desordenadas | error | Síntoma de un fallo en el ensamblado |
| Marcas de tiempo duplicadas | error | El backtest contaría operaciones de más |
| Nulos e infinitos | error | Una vela sin precio es una vela que no existe |
| Velas fuera de la rejilla del timeframe | error | El timeframe no es el que crees |
| Huecos | error | Se listan agrupados por tramos, con fechas |
| Vela imposible (`high` < `low`, etc.) | error | Rompe cualquier lógica de stops |
| Precios ≤ 0, volumen negativo | error | Datos corruptos |
| Discontinuidad cierre→apertura > 30% | error | Redenominación de token o datos malos |
| Última vela sin cerrar | error | Look-ahead |
| Discontinuidad cierre→apertura > 5% | aviso | Míralo tú |
| Movimiento > 35% en una vela | aviso | Puede ser un flash crash real |
| Velas con volumen cero | aviso / error si >1% | Ahí el precio no es un precio real |
| El rango no cubre lo que pediste | aviso | El par quizá no existía aún |

Se ejecutan **todas** antes de fallar, para que veas la lista completa de una
vez en lugar de descubrir los problemas de uno en uno.

Sobre los "splits": en cripto no existen los splits de acciones, pero sí las
redenominaciones de tokens y los cambios de ticker, que producen el mismo
efecto (el precio se multiplica o se divide de golpe). Como el cripto cotiza
24/7, el cierre de una vela y la apertura de la siguiente deberían ser casi
el mismo precio: una discontinuidad grande delata ese tipo de sucesos.

### La caché guarda una huella de los datos

Junto a cada `.parquet` hay un `.meta.json` con el sha256 del contenido, el
rango, y el informe de validación de aquel momento. Sirve para tres cosas:

1. Detectar un fichero corrupto o escrito a medias.
2. Detectar que alguien ha editado los datos a mano (tú, dentro de seis
   meses, "arreglando" un precio raro). La lectura falla en vez de seguir.
3. Poder anotar en el informe de un backtest con qué datos exactos se hizo.

La escritura es atómica: si el proceso se muere a mitad, te quedas con la
versión anterior íntegra, no con un fichero truncado.

### La caché puede tener huecos, y se reintentan

Un hueco puede ser real (el mercado paró) o accidental (se cortó la
descarga). Desde fuera no se distinguen, así que en cada carga se vuelven a
pedir los tramos que faltan. Si el hueco es real, el exchange no devuelve
nada, la validación lo sigue detectando y te enteras igual. Cuesta una
petición pequeña; a cambio, un corte de wifi no deja una cicatriz permanente
e invisible en tus datos.

---

## Tests

```bash
.venv/bin/python -m pytest
```

83 tests, todos sin conexión a internet, en menos de 5 segundos. Un test que
depende de la red es un test que un día falla por motivos ajenos a tu código,
y que acabas ignorando; en cuanto ignoras un test, ya no tienes tests.

El truco es `ExchangeFalso` (en `tests/conftest.py`): un exchange simulado con
el mismo contrato que el real, capaz de provocar averías que en producción
existen y a mano son imposibles de reproducir —respuestas vacías, velas
repetidas, un exchange que no avanza, valores contradictorios entre dos
descargas.

---

## Qué puede fallar (lo que sé que no está cubierto)

1. **El cliente real de ccxt no se ha ejecutado nunca contra Binance.** El
   entorno donde se escribió esto tiene bloqueado `api.binance.com`. La
   lógica de reintentos está testeada con un ccxt simulado, pero la primera
   descarga real es, de hecho, la primera prueba. Empieza con un día de velas
   de 1h y mira el resultado antes de bajarte cinco años.
2. **Los umbrales de "esto es raro" son opiniones, no verdades.** 5% de
   discontinuidad, 35% de movimiento en una vela, 1% de velas sin volumen.
   Están todos juntos y a la vista en `UmbralesValidacion`. Si algún día los
   cambias para que un dataset "pase", estás haciendo trampas a sabiendas.
3. **Binance reescribe historia de vez en cuando.** Si un dato cacheado y uno
   recién descargado no coinciden, el laboratorio se para en vez de elegir
   uno. Eso es lo correcto, pero significa que tendrás que decidir tú.
4. **Un dato puede ser válido y aun así ser malo.** Que una vela sea coherente
   no significa que refleje un precio al que tú hubieras podido operar. La
   liquidez real no está modelada: eso llega en la Fase 2 con el slippage.
5. **No se descargan aún las tasas de funding** de los perpetuos. Hace falta
   para la Fase 2, y se añadirá ahí.
6. **La caché crece sin límite.** No hay purga automática. Velas de 1 minuto
   de varios años ocupan gigas.
7. **Solo se soportan timeframes de duración constante** (de 1m a 1w). El
   mensual está rechazado a propósito: los meses no duran lo mismo y no se
   pueden detectar huecos con fiabilidad.
