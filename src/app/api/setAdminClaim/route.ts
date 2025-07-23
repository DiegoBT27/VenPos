// Este archivo ya no es necesario con el enfoque de Firebase Functions Callable.
// Puedes eliminarlo de forma segura. Lo vacío para evitar errores.
export async function POST(request: Request) {
    return new Response(JSON.stringify({ message: "This endpoint is deprecated." }), { status: 410 });
}
