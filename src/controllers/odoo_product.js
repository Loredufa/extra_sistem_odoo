const axios = require('axios');

const {odoo_db, odoo_url, odoo_api_key} = require('../utils/config/index')


//Crear producto en Odoo
const create_product = async (req, res) => {

    const { name, price, type } = req.body;

    // Validar datos de entrada
    if (!name || !price) {
        return res.status(400).json({ error: 'Faltan datos obligatorios: name, price' });
    }

    const payload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
            service: 'object',
            method: 'execute_kw',
            args: [
                odoo_db,              // Base de datos
                2,                    // ID del usuario (Admin)
                odoo_api_key,         // API Key del usuario
                'product.product',    // Modelo de Odoo
                'create',             // Método del modelo
                [{
                    name: name,
                    list_price: price,
                    type: type || 'consu',  // Tipo de producto (por defecto: consumible)
                    //default_code: code || '', // Código interno (opcional)
                }],
            ],
        },
        id: 1,
    };
    try {
        const response = await axios.post(`${odoo_url}/jsonrpc`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        // Procesa respuesta de Odoo
        if (response.data.result) {
            res.json({ success: true, product_id: response.data.result });
        } else {
            res.status(500).json({ error: 'Error al crear el producto en Odoo.' });
        }
    } catch (error) {
        console.error('Error al conectar con Odoo:', error.message);
        res.status(500).json({ error: 'Error al conectar con Odoo.' });
    }   
}

const get_all_products = async (req, res) => {
    const payload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
            service: 'object',
            method: 'execute_kw',
            args: [
                odoo_db,              // Base de datos
                2,                    // ID del usuario (Admin)
                odoo_api_key,         // API Key del usuario
                'product.product',    // Modelo de Odoo
                'search_read',        // Método del modelo
                [
                    [],                // Filtros (vacío = todos los productos)
                    ['id', 'name', 'list_price', 'type'], // Campos a devolver
                ],
            ],
        },
        id: 1,
    };

    try {
        const response = await axios.post(`${odoo_url}/jsonrpc`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.data.result) {
            res.json({ success: true, products: response.data.result });
        } else {
            res.status(500).json({ error: 'No se encontraron productos.' });
        }
    } catch (error) {
        console.error('Error al conectar con Odoo:', error.message);
        res.status(500).json({ error: 'Error al conectar con Odoo.' });
    }
};

const delete_product = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'Se requiere un ID de producto para eliminar.' });
    }

    const payload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
            service: 'object',
            method: 'execute_kw',
            args: [
                odoo_db,              // Base de datos
                2,                    // ID del usuario (Admin)
                odoo_api_key,         // API Key del usuario
                'product.product',    // Modelo de Odoo
                'unlink',             // Método del modelo
                [[parseInt(id)]],     // ID del producto a eliminar (como lista)
            ],
        },
        id: 1,
    };

    try {
        const response = await axios.post(`${odoo_url}/jsonrpc`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.data.result) {
            res.json({ success: true, message: `Producto con ID ${id} eliminado correctamente.` });
        } else {
            res.status(500).json({ error: 'Error al eliminar el producto.' });
        }
    } catch (error) {
        console.error('Error al conectar con Odoo:', error.message);
        res.status(500).json({ error: 'Error al conectar con Odoo.' });
    }
};

const update_product = async (req, res) => {
    const { id } = req.params;
    const { name, price, type } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Se requiere un ID de producto para modificar.' });
    }

    if (!name && !price && !type) {
        return res.status(400).json({ error: 'Se requiere al menos un campo para modificar.' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (price) updates.list_price = price;
    if (type) updates.type = type;

    const payload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
            service: 'object',
            method: 'execute_kw',
            args: [
                odoo_db,              // Base de datos
                2,                    // ID del usuario (Admin)
                odoo_api_key,         // API Key del usuario
                'product.product',    // Modelo de Odoo
                'write',              // Método del modelo
                [[parseInt(id)], updates], // IDs y campos a actualizar
            ],
        },
        id: 1,
    };

    try {
        const response = await axios.put(`${odoo_url}/jsonrpc`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.data.result) {
            res.json({ success: true, message: `Producto con ID ${id} modificado correctamente.` });
        } else {
            res.status(500).json({ error: 'Error al modificar el producto.' });
        }
    } catch (error) {
        console.error('Error al conectar con Odoo:', error.message);
        res.status(500).json({ error: 'Error al conectar con Odoo.' });
    }
};

const get_product = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'Se requiere un ID de producto para consultar.' });
    }

    const payload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
            service: 'object',
            method: 'execute_kw',
            args: [
                odoo_db,              // Base de datos
                2,                    // ID del usuario (Admin)
                odoo_api_key,         // API Key del usuario
                'product.product',    // Modelo de Odoo
                'read',               // Método del modelo
                [[parseInt(id)], ['id', 'name', 'list_price', 'type']], // ID y campos a devolver
            ],
        },
        id: 1,
    };

    try {
        const response = await axios.post(`${odoo_url}/jsonrpc`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.data.result) {
            res.json({ success: true, product: response.data.result[0] });
        } else {
            res.status(404).json({ error: 'Producto no encontrado.' });
        }
    } catch (error) {
        console.error('Error al conectar con Odoo:', error.message);
        res.status(500).json({ error: 'Error al conectar con Odoo.' });
    }
};



module.exports = {
    create_product,
    get_all_products,
    delete_product,
    update_product,
    get_product
}