# Configuración de Reglas de Firestore

Para que la aplicación funcione correctamente, necesitas actualizar las reglas de seguridad de tu base de datos Firestore.

## Pasos:

1.  **Abre tu proyecto de Firebase.**
2.  Ve a la sección **Firestore Database**.
3.  Haz clic en la pestaña **Rules** (Reglas).
4.  Copia el contenido del archivo `firestore.rules` que se encuentra en la raíz de este proyecto.
5.  Pega el contenido en el editor de reglas en la consola de Firebase, reemplazando cualquier regla existente.
6.  Haz clic en **Publish** (Publicar).
7.  Asegúrate de haber desplegado las funciones de Firebase con el comando `firebase deploy --only functions`.

Con esto, tu sistema de autenticación y gestión de datos debería funcionar sin problemas.
