const OpenAI = require('openai');
const axios = require('axios');
const {product_agent} = require('./Product_agent')


const {openai_org, openai_api_key, odoo_db, odoo_url, odoo_api_key} = require('../utils/config/index')

const apiKey= openai_api_key
const organization= openai_org


//Inicia openai
const openai = new OpenAI({
    apiKey: apiKey,
    organization: organization,
})


const admin_agent = async (req, res) => {
    try {
        const { query, userId } = req.body; // `userId` para identificar al usuario
        conversationSessions[userId] = conversationSessions[userId] || []; // Inicializa el historial si no existe

        // Añade la consulta del usuario al historial
        conversationSessions[userId].push({ role: "user", content: query });

        // Llama a OpenAI con el historial
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: `
                    Interpreta las consultas de los usuarios para gestionar productos en una base de datos, realizando acciones a través del agente 
                    "product_agent". Sigue las instrucciones a continuación para satisfacer las solicitudes del usuario:
                    
                    - **Crear un Producto**: Verifica que el usuario ha proporcionado el nombre y el precio del producto. Si estos datos están presentes, llama 
                    a "product_agent(query)" con una consulta como: "{"query" : "el usuario quiere crear el producto de nombre [nombre] con un precio de [precio]
                    "}". Espera la respuesta y entrégala al usuario.
                    
                    - **Actualizar un Producto**: 
                        - Si el usuario busca un producto por nombre usa "find_product_by_name(name)" para obtener el id, si hay coincidencias parciales, 
                          solicita confirmación al usuario sobre cuál producto es el correcto.
                        - En cualquier caso antes de realizar la accion llamando al product_agent(query) debes confirmar con el usuario que se trata del producto correcto.
                        - Si hay múltiples coincidencias, indícalas al usuario y solicita más especificaciones.
                        - Si el usuario confirma, procede a realizar la acción solicitada con el id del producto correspondiente llamando a "product_agent(query).        
                        - Si el usuario ya conoce el id, directamente llama a "product_agent(query)". 
                        Ejemplo de query: "{"query" : "El usuario quiere modificar el producto con id [id] y el detalle de las modificaciones"}
                        
                    - **Eliminar un Producto**: 
                        - Si el usuario busca un producto por nombre usa "find_product_by_name(name)" para obtener el id, si hay coincidencias parciales, 
                          solicita confirmación al usuario sobre cuál producto es el correcto.
                        - En cualquier caso antes de realizar la accion llamando al product_agent(query) debes confirmar con el usuario que se trata del producto correcto.
                        - Si hay múltiples coincidencias, indícalas al usuario y solicita más especificaciones.
                        - Si el usuario confirma, procede a realizar la acción solicitada con el id del producto correspondiente llamando a "product_agent(query).        
                        - Si el usuario ya conoce el id, directamente llama a "product_agent(query)". 
                        Ejemplo de query: "{"query" : "El usuario quiere eliminar el producto con id [id]"}

                    - **Buscar Información de un Producto**:
                        - Si el usuario busca un producto por nombre usa "find_product_by_name(name)" para obtener el id, si hay coincidencias parciales, 
                          solicita confirmación al usuario sobre cuál producto es el correcto.
                        - En cualquier caso antes de realizar la accion llamando al product_agent(query) debes confirmar con el usuario que se trata del producto correcto.
                        - Si hay múltiples coincidencias, indícalas al usuario y solicita más especificaciones.
                        - Si el usuario confirma, procede a realizar la acción solicitada con el id del producto correspondiente llamando a "product_agent(query).        
                        - Si el usuario ya conoce el id, directamente llama a "product_agent(query)". 
                        Ejemplo de query: 
                          "{"query" : "El usuario quiere obtener la información del producto con id [id]"}".

                    - **Listar Productos**: Llama a "product_agent(query)" con "{"query" : "El usuario quiere obtener el listado de todos productos"}" para obtener 
                    la lista completa de productos.

                    Espera siempre la respuesta de "product_agent(query)" antes de responder al usuario.

                    # Output Format
                    El resultado final debe ser entregado al usuario en el mismo formato en que se recibe desde "product_agent(query)".

                    # Notes
                    Asegúrate de manejar los casos en que el usuario proporciona información incompleta solicitando los datos necesarios antes de proceder. 
                    También recuerda que siempre debes obtener y manejar el "id" cuando sea necesario usando "find_product_by_name(name)".
                    ` },
                    ...conversationSessions[userId], // Incluye el historial completo
                ],
                functions: [
                    {
                        name: "find_product_by_name",
                        description: "Busca un producto por nombre y devuelve su ID y nombre",
                        parameters: {
                            type: "object",
                            properties: {
                                name: {
                                    type: "string",
                                    description: "Nombre del producto que se desea buscar",
                                },
                            },
                            required: ["name"],
                        },
                    },
                    {
                        name: "product_agent",
                        description: "Realiza una acción en la base de datos, como crear, actualizar, eliminar o consultar productos",
                        parameters: {
                            type: "object",
                            properties: {
                                query: {
                                    type: "string",
                                    description: "Consulta estructurada que describe la acción que se debe realizar en la base de datos",
                                },
                            },
                            required: ["query"],
                        },
                    },
                ],
                temperature: 0.1,
                max_tokens: 500,
            });
    
            const { function_call, content } = completion.choices[0].message;
    
            if (function_call) {
                const { name, arguments: args } = function_call;
                const parsedArgs = JSON.parse(args);
    
                let response;
    
                switch (name) {
                    case "find_product_by_name":
                        const products = await find_product_by_name(parsedArgs.name);
                        if (!products || products.length === 0) {
                            response = { error: "No se encontraron productos con ese nombre." };
                        } else if (products.length === 1) {
                            // Si solo hay un producto, pide confirmación al usuario
                            response = {
                                message: `Se encontró un producto: ${products[0].name}. ID: ${products[0].id}. ¿Es este el producto correcto?`,
                                confirm: true,
                            };
                        } else {
                            // Si hay múltiples productos, pide especificar
                            const productList = products.map(p => `${p.name} (ID: ${p.id})`).join(", ");
                            response = {
                                message: `Se encontraron varios productos: ${productList}. Por favor, especifica más.`,
                            };
                        }
                        break;
    
                    case "product_agent":
                        // Configurar manualmente req.body para asegurarte de que tenga el formato correcto
                        req.body = { query: parsedArgs.query };
                        return product_agent(req, res);
    
                    default:
                        response = { error: "Función no reconocida." };
                }
    
                // Añade la respuesta al historial
                conversationSessions[userId].push({ role: "assistant", content: JSON.stringify(response) });
    
                // Envía la respuesta al cliente
                return res.json(response);
            } else if (content) {
                // Si hay un mensaje de texto, añádelo al historial y envíalo al cliente
                conversationSessions[userId].push({ role: "assistant", content });
                return res.json({ message: content });
            } else {
                // Caso de error: ni función ni contenido
                res.status(400).json({ error: "El modelo no devolvió una función ni un mensaje." });
            }
    
        } catch (error) {
            console.error("Error en admin_agent:", error.message);
            res.status(500).json({ error: "Error en el agente administrador." });
        }
};

// Almacena sesiones de conversación (puedes usar Redis para persistencia)
const conversationSessions = {};

// Función auxiliar para buscar productos por nombre
const find_product_by_name = async (name) => {
    console.log("Buscando producto por nombre:", name);
    const payload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
            service: "object",
            method: "execute_kw",
            args: [
                odoo_db,
                2,
                odoo_api_key,
                "product.product",
                "search_read",
                [[["name", "ilike", name]], ["id", "name"]],
            ],
        },
        id: 1,
    };

    try {
        const response = await axios.post(`${odoo_url}/jsonrpc`, payload, {
            headers: { "Content-Type": "application/json" },
        });
        return response.data.result; // Devuelve todos los productos encontrados
    } catch (error) {
        console.error("Error buscando producto por nombre:", error.message);
        throw error;
    }
};

module.exports = {
    admin_agent,
};

