# Scraper NITS

Este proyecto está diseñado para extraer información de Google Maps, centrándose en la obtención de datos (dirección, tlf, email, etc) y en la preparación/limpieza de la información recopilada. Se utiliza Puppeteer js para el web scraping y la orquestación del flujo de datos, y Python para la limpieza/finalización de los datos.

## Estructura del Proyecto

- **code/**
  - [scraper.js](code/scraper.js): Contiene la lógica para raspar resultados de búsqueda en Google Maps
  - [email_scraper.js](code/email_scraper.js): Implementa la función de scraping de correos electrónicos a partir de las direcciones web recopiladas.
  - [main.js](code/main.js): Orquesta la ejecución del scraping, la verificación de datos y la ejecución del script de limpieza en Python.
  - [aux_functions.js](code/aux_functions.js): Funciones auxiliares para tareas comunes (como esperar, escribir archivos en JSON/CSV, limpiar datos y correos).
  - [data_prep_nits.py](code/data_prep_nits.py) / [data_prep_nits.ipynb](code/data_prep_nits.ipynb): Script en Python que se encarga de la preparación y limpieza de los datos extraídos.

- **data/**
  - Almacena los archivos de datos en formatos CSV y JSON generados durante la ejecución.


## Cómo Ejecutar el Proyecto

Para una ejecución rápida y sencilla sigue estos pasos:

1. **Requisitos:**
   - Tener instalado Node.js.
   - Tener instalado Python (la versión necesaria para [data_prep_nits.py](code/data_prep_nits.py)).
   - Instalar las dependencias de Node.js (por ejemplo, Puppeteer) si aún no lo has hecho.

2. **Instalación de Dependencias:**

   En el directorio raíz, ejecuta:
   ```sh
   npm install puppeteer
   ```
    ```sh
    pip install pandas
    ```

3. **Ejecución del proyecto:**

   En el directorio raíz, ejecuta:
   ```sh
   node code/main.js "tu búsqueda de google maps"
   ```

   Esto iniciará el proceso de scraping y limpieza de datos. Los resultados se almacenarán en el directorio `data/`.

