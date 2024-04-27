//let model = tf.sequential();

window.onload = () => {
    // Referencia a objetos definidos en html mediante atributo ID
    const selectorImagen = document.getElementById("imagenSubida");
    const imagenOriginal = document.getElementById("imagenOriginal");
    const imagenTransformada = document.getElementById("imagenesTransformadas");
    const botonSiguientePaso = document.getElementById("siguientePaso");
    
    // Variables para transformación de imágenes
    let imagenActual = null;
    let numeroPaso = 0;
    
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
    
    const mostrarImagen = () => {
        tf.browser.toPixels(
            imagenActual, 
            imagenTransformada
        );
    }

    // Funciones para importación de imagen a contexto actual
    const controlarCambioImagen = ( evt ) => {
        
        const archivos = evt.target.files;

        if (archivos.length > 0 ){
            const original = archivos[0];
            const lector = new FileReader();

            // Leer información de archivo y transformarlo a imagen
            lector.readAsDataURL(original);
            lector.onload = (e) => {
                const image = new Image(500, 500);

                // Asignar información de archivo a imagen
                image.src = e.target.result;
                
                image.onload = () => {
                    imagenActual = tf.browser.fromPixels(image, 3).div(255);
                    numeroPaso = 0;
                    
                    // Presentar imagen original en contenedor designado
                    tf.browser.toPixels(
                        imagenActual, 
                        imagenOriginal
                    );
                    
                    mostrarImagen();
                    
                }
            }
        }
        
        imagenActual = null;
    }
    
    const controlarClickBotonSiguientePaso = () => {
        if ( imagenActual ) {
            imagenActual = agregarRuidoGaussiano( imagenActual );
            mostrarImagen();
            
            numeroPaso ++;
        }
    }

    // Definición de eventos para objetos definidos
    selectorImagen.addEventListener(
        "change", controlarCambioImagen, false
    );
    
    botonSiguientePaso.addEventListener(
        "click", controlarClickBotonSiguientePaso, false
    )
}
