
'use server';
/**
 * @fileOverview Flujo de IA para extraer información de productos desde una imagen.
 *
 * - extractProductInfo - Extrae detalles de uno o más productos a partir de la imagen de una factura o etiqueta.
 * - ExtractProductInfoInput - El tipo de entrada para la función.
 * - ExtractProductInfoOutput - El tipo de retorno de la función, que es un array de productos.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractProductInfoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Una foto de una factura o etiqueta de producto, como un data URI que debe incluir un MIME type y usar Base64. Formato esperado: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractProductInfoInput = z.infer<typeof ExtractProductInfoInputSchema>;

const ProductoExtraidoSchema = z.object({
  nombre: z.string().describe('El nombre del producto extraído de la imagen.'),
  descripcion: z.string().describe('Una breve descripción del producto si está disponible.'),
  precio_bs: z.number().describe('El precio en Bolívares (Bs) del producto. Solo el número.'),
  unidad: z.enum(['kg', 'unidad', 'litro', 'paquete']).optional().describe('La unidad de medida, si se puede inferir. Opciones: kg, unidad, litro, paquete.'),
});

const ExtractProductInfoOutputSchema = z.object({
    productos: z.array(ProductoExtraidoSchema).describe("Una lista de todos los productos encontrados en la imagen.")
});

export type ExtractProductInfoOutput = z.infer<typeof ExtractProductInfoOutputSchema>;

export async function extractProductInfo(input: ExtractProductInfoInput): Promise<ExtractProductInfoOutput> {
  return extractProductInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractProductInfoPrompt',
  input: {schema: ExtractProductInfoInputSchema},
  output: {schema: ExtractProductInfoOutputSchema},
  prompt: `Eres un asistente de entrada de datos experto para un sistema de punto de venta. Tu tarea es analizar la imagen de una factura o etiqueta de producto y extraer la información de TODOS los productos que encuentres en ella con la mayor precisión posible.

  Analiza la siguiente imagen: {{media url=photoDataUri}}

  Para cada producto encontrado, extrae los siguientes campos:
  - nombre: El nombre principal del producto.
  - descripcion: Cualquier detalle adicional o descripción corta. Si no hay, déjalo vacío.
  - precio_bs: El precio final del producto en Bolívares. Extrae solo el valor numérico, sin símbolos de moneda.
  - unidad: Si puedes inferir la unidad de medida (por ejemplo, si dice "Kg", "Lt", "Pza"), asígnala a una de las siguientes categorías: 'kg', 'unidad', 'litro', 'paquete'. Si no es obvio, no incluyas este campo.

  Devuelve una lista de todos los productos encontrados en un array llamado "productos", estructurado según el esquema de salida. Si solo encuentras un producto, devuelve un array con un solo elemento.`,
});

const extractProductInfoFlow = ai.defineFlow(
  {
    name: 'extractProductInfoFlow',
    inputSchema: ExtractProductInfoInputSchema,
    outputSchema: ExtractProductInfoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.productos) {
      throw new Error("La IA no pudo procesar la imagen. Inténtelo de nuevo.");
    }
    return output;
  }
);
