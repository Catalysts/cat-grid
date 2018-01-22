# CatNgGrid - Drag and drop

## Building the library

> npm run-script cleanbuild


## Publishing

Go to the npm subfolder

> npm --registry __URL_OF_YOUR_REGISTRY_HERE__ publish


## Example project

Navigate to the `example` subfolder.

Ensure that you see the library source (from the main `src` folder) also within `example\src\lib\` (on Windows you have to copy it there, on Linux it should be a symlink).

Then run:

> npm install

> npm start


## End2End Tests

Naivate to the `example` subfolder.

Then run:

> npm run-script e2e
