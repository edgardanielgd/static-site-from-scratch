// Funciones de utilidad

// Sobreescritura de función módulo para calculo correcto con numeros negativos
const mod = (a,b) => {
  return ((a % b) + b) % b;
};

// Construcción de modelo a usar para la conversión de una imagen a un vector latente de valores
const modelo = tf.sequential({   
    layers: [
        tf.layers.conv2d({ // Convolución con 8 filtros, filtro de tamaño 4x4, strides de 2x2 y padding 0
            filters: 8,
            kernelSize: 4,
            strides: 2,
            padding: "valid",
            activation: "relu",
            inputShape: [200,200,3]
        }), // Salida: 84x84x8
        tf.layers.maxPooling2d({ // Reducir dimensionalidad de una imagen con MaxPooling con filtro de tamaño 2x2
            poolSize: 2
        }), // Salida 48x48x8
        tf.layers.conv2d({ // Convolución con 16 filtros, filtro de tamaño 4x4, strides de 2x2 y padding 0
            filters: 16,
            kernelSize: 4,
            strides: 2,
            padding: "valid",
            activation: "relu"
        }), // Salida: 21x21x16
        tf.layers.maxPooling2d({ // Reducir dimensionalidad de una imagen con MaxPooling con filtro de tamaño 3x3
            poolSize: 3
        }), // Salida 7x7x16
        tf.layers.flatten(), // Salida 1x1x784
        tf.layers.dense({
            units: 64,
            activation: "relu"
        }), // Reducir dimensionalidad de imagen a un vector de tamaño 64
        tf.layers.dense({
            units: 16
        }) // Reducir dimensionalidad de imagen a un vector de tamaño 16
    ]
})

modelo.summary();

window.onload = () => {
    
    // Referencia a objetos definidos en html mediante atributo ID
    const selectorImagen = document.getElementById("imagenSubida");
    const canvasImagenOriginal = document.getElementById("imagenOriginal");
    const canvasImagenTransformada = document.getElementById("imagenesTransformadas");
    const botonSiguientePaso = document.getElementById("siguientePaso");
    const parrafoPasoActual = document.getElementById("parrafoPasoImagen");
    const contenedorImagenes = document.getElementById("contenedorImagenes");
    const botonNavegarAnteriorPaso = document.getElementById("navegarAnteriorPaso");
    const contenedorPasos = document.getElementById("pasos");
    const botonNavegarSiguientePaso = document.getElementById("navegarSiguientePaso");
    const botonCalcularvector = document.getElementById("calcularVector");
    const resultadoCalculoVector = document.getElementById("resultadoCalculoVector");
    
    // Ocultar contenedor de imagenes al inicio
    contenedorImagenes.style.display = "none";
    
    // Variables para transformación de imágenes
    let historial = [];
    let puntosNavegacion = [];
    let width, height;
    let indicePasoActual = 0;
    
    // Función para agregar ruido gaussiano a un conjunto de pixeles de una imagen
    const agregarRuidoGaussiano = (datosPixeles) => {
        const forma = datosPixeles.shape;
        const media = 0;
        const stdDev = 0.01 ** 0.5;
        
        // Crear vector de ruido gaussiano
        const ruido = tf.randomNormal(
            [forma[0], forma[1], 1], 
            media, stdDev
        );
        
        // Imagen con ruido
        let nuevaImagen = datosPixeles.add(ruido);
        
        // Transformar imagen con ruido
        const min_valor = tf.min(nuevaImagen);
        const max_valor = tf.max(nuevaImagen);
        
        nuevaImagen = nuevaImagen
            .sub(min_valor)
            .mul(
                tf.scalar(1).div(
                    max_valor.sub(min_valor)
                )
            );
        
        return nuevaImagen;
    }
    
    // Función para mostrar imágenes 
    const mostrarImagenes = () => {
        
        if ( historial.length == 0 ) return;
        
        const imagenOriginal = historial[0];
        const imagenPasoActual = historial[ indicePasoActual ] || imagenOriginal;
        
        // Acomodar imagenes a tamaño de pantalla
        
        const anchoImagenOriginal = imagenOriginal.shape[0];
        const altoImagenOriginal = imagenOriginal.shape[1];
        
        const anchoPantalla = window.innerWidth;
        
        const anchoDestino = parseInt( 
            anchoPantalla * (
                ( anchoPantalla > 800 ) ? 0.25 : 0.5
            )
        );
        const altoDestino = parseInt( anchoDestino * altoImagenOriginal / anchoImagenOriginal );
        
        const imagenOriginalAcomodada = tf.image.resizeBilinear(
            imagenOriginal, 
            [anchoDestino, altoDestino]
        )
        
        const imagenPasoActualAcomodada = tf.image.resizeBilinear(
            imagenPasoActual, 
            [anchoDestino, altoDestino]
        )
        
        // Dibujar imagenes en canvas destino
        tf.browser.toPixels(
            imagenOriginalAcomodada, 
            canvasImagenOriginal
        );
        
        tf.browser.toPixels(
            imagenPasoActualAcomodada, 
            canvasImagenTransformada
        );
        
        // Actual texto de párrafo que indica la información del paso actual mostrado
        parrafoPasoActual.innerHTML = `Imagen transformada, paso <b>${indicePasoActual + 1}</b> de <b>${historial.length}</b>`;
    }
    
    // Función para cambiar el indice del paso que se muestra actualmente
    const cambiarIndiceActual = (nuevoIndice) => {
        puntosNavegacion[indicePasoActual].className = "";
        indicePasoActual = nuevoIndice;
        puntosNavegacion[indicePasoActual].className = "actual";
    }
    
    // Función para borrar los puntos de navegación creados hasta el momento
    const borrarIndices = () => {
        puntosNavegacion.forEach( punto => {
            punto.remove();
        })
        puntosNavegacion = [];
    }
    
    // Función para agregar puntos de navegación de pasos
    const agregarPuntoNavegacion = ( indiceDestino ) => {
        
        // Agregar un nuevo punto de navegación a la lista
        const nuevoPunto = document.createElement("p");
        
        nuevoPunto.addEventListener(
            "click", () => {
                cambiarIndiceActual( indiceDestino );
                mostrarImagenes();
            }
        )
        
        puntosNavegacion.push( nuevoPunto );
        contenedorPasos.appendChild( nuevoPunto );
        cambiarIndiceActual( indiceDestino );
    }

    // Función para importación de imagen a contexto actual
    const controlarCambioImagen = ( evt ) => {
        
        const archivos = evt.target.files;

        if (archivos.length > 0 ){
            const original = archivos[0];
            const lector = new FileReader();

            // Leer información de archivo y transformarlo a imagen
            lector.readAsDataURL(original);
            lector.onload = (e) => {
                const image = new Image();

                // Asignar información de archivo a imagen
                image.src = e.target.result;
                
                image.onload = () => {
                    imagenActual = tf.browser.fromPixels(image, 3).div(255);
                    historial.push(imagenActual);
                    agregarPuntoNavegacion( 0 );
                    contenedorImagenes.style.display = "flex"
                    mostrarImagenes();
                }
            }
        }
        
        historial = [];
        indicePasoActual = 0;
        contenedorImagenes.style.display = "none";
        borrarIndices();
    }
    
    // Función para agregar un nuevo paso de introducción de ruido
    const controlarClickBotonSiguientePaso = () => {
        
        if ( historial.length == 0 ) return;
        
        const imagenActual = historial[historial.length - 1];
        const nuevaImagen = agregarRuidoGaussiano( imagenActual );
        
        historial.push(nuevaImagen);
        agregarPuntoNavegacion( historial.length - 1 );        
        mostrarImagenes();
    }
    
    // Funciones para navegar entre pasos usando botones proporcionados
    const avanzarAnteriorPaso = () => {
        cambiarIndiceActual(mod(indicePasoActual - 1, historial.length));
        mostrarImagenes();
    }
    
    const avanzarSiguientePaso = () => {
        cambiarIndiceActual(mod(indicePasoActual + 1, historial.length));
        mostrarImagenes();
    }
    
    // Función para cálculo de vector latente para imagen proveída
    const calcularVectorLatente = () => {
        if ( historial.length == 0 ) return;
        
        const imagenOriginal = historial[0];
        const resultado = modelo.predict(
            tf.expandDims(
                    tf.image.resizeBilinear(
                    imagenOriginal, 
                    size=[200,200]
                )
            )
        );
        
        resultado.data().then(
            vectorLatente => {
                vectorLatente.forEach(
                    elementoVector => {
                        const divElemento = document.createElement("div");
                        const pElemento = document.createElement("p");
                        divElemento.appendChild( pElemento );
                        pElemento.innerHTML= `<b>${
                            elementoVector.toFixed(5)
                        }</b>`;
                        pElemento.className="textoContenido";
                        resultadoCalculoVector.appendChild( divElemento );
                    }
                )
            }
        )
    }

    // Definición de eventos para objetos definidos
    selectorImagen.addEventListener(
        "change", controlarCambioImagen, false
    );
    
    botonSiguientePaso.addEventListener(
        "click", controlarClickBotonSiguientePaso, false
    )
    
    botonNavegarAnteriorPaso.addEventListener(
        "click", avanzarAnteriorPaso, false
    )
    
    botonNavegarSiguientePaso.addEventListener(
        "click", avanzarSiguientePaso, false
    )
    
    botonCalcularvector.addEventListener(
        "click", calcularVectorLatente, false
    )
    
    window.addEventListener(
        "resize", 
        () => { mostrarImagenes() }, 
        false
    )
}
