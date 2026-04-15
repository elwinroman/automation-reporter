# Concepto Visible "Ejecucion"

## Contexto

Desde el 2026-04-14, la aplicacion usa el termino visible `Ejecucion` en lugar de `Producto` o `Productos` en la UI y en parte de la documentacion funcional.

El motivo fue semantico: en TestComplete puede llegar un path global, por lo que el concepto de `Producto` no siempre representa bien lo que el usuario interpreta en pantalla.

## Alcance del cambio realizado

El cambio aplicado fue intencionalmente superficial:

- se actualizaron labels, titulos, columnas y descripciones visibles del frontend
- se ajusto documentacion funcional general
- no se modifico la logica de agregacion
- no se modificaron rutas, endpoints, contratos tRPC ni nombres internos de tipos

## Estado actual

Internamente el sistema sigue modelando esta entidad como `product`.

Eso afecta, entre otros, estos puntos:

- `FolderMetadata.product`
- `ProductSummary`
- `report.products`
- `report.productDetail`
- ruta frontend `/products/:product`
- agregacion principal por `exec.metadata.product`

En otras palabras:

- nombre visible para usuario: `Ejecucion`
- nombre tecnico interno actual: `product`

## Implicacion

Hoy existe una diferencia entre lenguaje de UI y lenguaje de dominio interno.

Esto es aceptable mientras el objetivo sea solo mejorar la lectura para el usuario, pero debe considerarse deuda tecnica semantica. Si en el futuro se necesita que el modelo represente paths globales de forma correcta, no bastara con renombrar textos: habra que refactorizar la identidad de esta entidad.

## Direccion recomendada para un refactor futuro

Si se decide alinear el modelo interno con el concepto visible, el refactor deberia separar al menos estas piezas:

- `displayName`: nombre visible en UI
- `pathKey` o `logicalPath`: identificador canonico basado en el path completo
- `leafName`: ultimo segmento del path
- `rootCategory`: primer segmento del path, si sigue siendo util
- `segments`: lista completa de segmentos

Con eso la UI podria seguir mostrando `Ejecucion`, pero el backend dejaria de depender del ultimo segmento como identidad primaria.

## Criterio para ejecutar ese refactor

Conviene hacerlo cuando ocurra al menos una de estas condiciones:

- dos ejecuciones distintas compartan el mismo ultimo segmento y hoy colisionen semanticamente
- se necesite filtrar, navegar o agregar por path completo
- TestComplete empiece a enviar estructuras globales donde `product` sea ambiguo
- el equipo quiera alinear API, rutas y tipos con el lenguaje visible de negocio

## Regla mientras no se refactorice

Mientras el modelo interno siga igual:

- no asumir que `Ejecucion` implica una nueva entidad tecnica
- tratar `Ejecucion` como alias visual de lo que internamente aun es `product`
- evitar cambios parciales de contrato que mezclen nombres nuevos con logica antigua sin una migracion explicita
