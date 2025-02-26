const axios = require('axios');

const {odoo_db, odoo_url, odoo_api_key} = require('../utils/config/index')


//Crear producto en Odoo
const create_product = async (req, res) => {
    // Datos del producto y del proveedor (se espera que se envíe el ID del proveedor)
    const { name, price, type, supplier_id } = req.body;
    console.log('soy el BODY', req.body);
    
    // Validar datos obligatorios
    if (!name || !price || !supplier_id) {
        return res.status(400).json({ error: 'Faltan datos obligatorios: name, price y supplier_id' });
    }

    // Convertir price a número
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) {
        return res.status(400).json({ error: 'El valor de price no es válido.' });
    }

    try {
        // 1. Verificar que el proveedor exista en Odoo.
        const supplierSearchPayload = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                service: 'object',
                method: 'execute_kw',
                args: [
                    odoo_db,
                    2,
                    odoo_api_key,
                    'res.partner',
                    'search_read',
                    [
                        [
                            ['id', '=', parseInt(supplier_id)],
                            ['supplier_rank', '>', 0]
                        ],
                        ['id']
                    ],
                ],
            },
            id: 1,
        };

        const supplierSearchResponse = await axios.post(`${odoo_url}/jsonrpc`, supplierSearchPayload, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (!supplierSearchResponse.data.result || supplierSearchResponse.data.result.length === 0) {
            return res.status(404).json({ error: 'El proveedor no existe.' });
        }

        // 2. Crear el producto en Odoo (modelo 'product.product')
        const productPayload = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                service: 'object',
                method: 'execute_kw',
                args: [
                    odoo_db,
                    2,
                    odoo_api_key,
                    'product.product',
                    'create',
                    [{
                        name: name,
                        list_price: numericPrice,
                        type: type || 'consu',
                    }],
                ],
            },
            id: 2,
        };

        const productResponse = await axios.post(`${odoo_url}/jsonrpc`, productPayload, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (!productResponse.data.result) {
            return res.status(500).json({ error: 'Error al crear el producto en Odoo.' });
        }
        const productId = productResponse.data.result;

        // 3. Obtener el ID del product template (necesario para crear la relación en product.supplierinfo)
        const productReadPayload = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                service: 'object',
                method: 'execute_kw',
                args: [
                    odoo_db,
                    2,
                    odoo_api_key,
                    'product.product',
                    'read',
                    [[parseInt(productId)], ['product_tmpl_id']],
                ],
            },
            id: 3,
        };

        const productReadResponse = await axios.post(`${odoo_url}/jsonrpc`, productReadPayload, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (!productReadResponse.data.result || productReadResponse.data.result.length === 0) {
            return res.status(500).json({ error: 'No se pudo obtener el template del producto.' });
        }
        const productTemplateId = productReadResponse.data.result[0].product_tmpl_id[0];

        // 4. Crear la relación entre el producto y el proveedor en el modelo 'product.supplierinfo'
        const supplierinfoPayload = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                service: 'object',
                method: 'execute_kw',
                args: [
                    odoo_db,
                    2,
                    odoo_api_key,
                    'product.supplierinfo',
                    'create',
                    [{
                        product_tmpl_id: productTemplateId,
                        name: parseInt(supplier_id),
                        delay: 0,
                        min_qty: 1,
                        price: numericPrice,
                    }],
                ],
            },
            id: 4,
        };

        const supplierinfoResponse = await axios.post(`${odoo_url}/jsonrpc`, supplierinfoPayload, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (!supplierinfoResponse.data.result) {
            return res.status(500).json({ error: 'Producto creado, pero error al vincular el proveedor.' });
        }

        return res.json({
            success: true,
            product_id: productId,
            supplierinfo_id: supplierinfoResponse.data.result,
        });
    } catch (error) {
        console.error('Error al conectar con Odoo:', error.message);
        return res.status(500).json({ error: 'Error al conectar con Odoo.' });
    }
};



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