const OpenAI = require('openai');
const axios = require('axios');
const {create_product, get_all_products, delete_product, update_product, get_product} = require('./odoo_product')


const {openai_org, openai_api_key} = require('../utils/config/index')

const apiKey= openai_api_key
const organization= openai_org


//Inicia openai
const openai = new OpenAI({
    apiKey: apiKey,
    organization: organization,
})


const product_agent = async (req, res) => {
    try {
        // Extrae la consulta del usuario
        console.log("Body:", req.body);
        const query = req.body.query;
        console.log("Query:", query);

        // Llama al modelo de OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Eres un asistente encargado de gestionar los productos en una base de datos. Tienes a tu cargo las siguientes funciones:

                    1. **Crear un producto**:
                    Llama a la función "create_product" con este JSON:
                    {
                        "name": "Nombre del producto",
                        "price": "Precio del producto en formato numérico",
                        "type": "consu"
                    }

                    2. **Obtener todos los productos**:
                    Llama a la función "get_all_products" sin parámetros.

                    3. **Obtener datos de un producto específico**:
                    Llama a la función "get_product" con el ID del producto como parámetro.

                    4. **Eliminar un producto**:
                    Llama a la función "delete_product" con el ID del producto como parámetro.

                    5. **Modificar un producto**:
                    Llama a la función "update_product" con el ID del producto y un JSON con los datos a modificar. Ejemplo:
                    {
                        "name": "Nuevo nombre del producto",
                        "price": "Nuevo precio en formato numérico",
                        "type": "consu"
                    }

                    Responde con claridad qué función ejecutar y los datos requeridos.`,
                },
                { role: "user", content: query },
            ],
            functions: [
                {
                    name: "create_product",
                    description: "Función para crear un producto",
                    parameters: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Nombre del producto" },
                            price: { type: "number", description: "Precio del producto" },
                            type: { type: "string", description: "Tipo de producto (ejemplo: 'consu')" },
                        },
                        required: ["name", "price", "type"],
                    },
                },
                {
                    name: "get_all_products",
                    description: "Función para obtener todos los productos",
                    parameters: {
                        type: "object",
                        properties: {},
                        required: [],
                    },
                },
                {
                    name: "get_product",
                    description: "Función para obtener datos de un producto específico",
                    parameters: {
                        type: "object",
                        properties: {
                            id: { type: "number", description: "ID del producto" },
                        },
                        required: ["id"],
                    },
                },
                {
                    name: "delete_product",
                    description: "Función para eliminar un producto",
                    parameters: {
                        type: "object",
                        properties: {
                            id: { type: "number", description: "ID del producto" },
                        },
                        required: ["id"],
                    },
                },
                {
                    name: "update_product",
                    description: "Función para modificar un producto",
                    parameters: {
                        type: "object",
                        properties: {
                            id: { type: "number", description: "ID del producto" },
                            name: { type: "string", description: "Nuevo nombre del producto (opcional)" },
                            price: { type: "number", description: "Nuevo precio del producto (opcional)" },
                            type: { type: "string", description: "Nuevo tipo de producto (opcional)" },
                        },
                        required: ["id"],
                    },
                },
            ],
            function_call: "auto",
            temperature: 0.1,
            max_tokens: 1000,
        });
        console.log('COMPLETION MESSAGE product_agent:', completion.choices[0].message);
        console.log('FUNCTION CALL product_agent:', completion.choices[0].message.function_call);

        // Procesar la respuesta del modelo
        const { function_call } = completion.choices[0].message;

        if (function_call) {
            const { name, arguments: args } = function_call;
            const parsedArgs = JSON.parse(args); // Parsea los argumentos de la función
            req.body = parsedArgs; // Asignar argumentos al body          

            // Ejecutar la función correspondiente
            switch (name) {
                case "create_product":                   
                    return create_product(req, res);
                case "get_all_products":
                    return get_all_products(req, res);
                case "get_product":
                    req.params = { id: parsedArgs.id };
                    return get_product(req, res);
                case "delete_product":
                    req.params = { id: parsedArgs.id };
                    return delete_product(req, res);
                case "update_product":
                    req.params = { id: parsedArgs.id };
                    req.body = parsedArgs;
                    return update_product(req, res);
                default:
                    res.status(400).json({ error: "Función no reconocida." });
            }
        } else {
            res.status(400).json({ error: "El modelo no indicó ninguna función." });
        }
    } catch (error) {
        console.error("Error en product_agent:", error.message);
        res.status(500).json({ error: "Error en el agente de productos." });
    }
};

  module.exports = {
    product_agent
}