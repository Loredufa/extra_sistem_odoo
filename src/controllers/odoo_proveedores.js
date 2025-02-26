const axios = require('axios');
const { odoo_db, odoo_url, odoo_api_key } = require('../utils/config/index');

// Crear proveedor en Odoo
const create_supplier = async (req, res) => {
    const { name, phone, email } = req.body;
    console.log('soy el BODY', req.body)
    if (!name) {
        return res.status(400).json({ error: 'Falta el nombre del proveedor.' });
    }

    const payload = {
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
            'create',
            [{
              name: name,
              phone: phone,
              email: email,
              supplier_rank: 1  // Se usa supplier_rank en lugar de supplier
            }],
          ],
        },
        id: 1,
      };      

    try {
        const response = await axios.post(`${odoo_url}/jsonrpc`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        if (response.data.result) {
            res.json({ success: true, supplier_id: response.data.result });
        } else {
            res.status(500).json({ error: 'Error al crear el proveedor en Odoo.' });
        }
    } catch (error) {
        console.error('Error al conectar con Odoo:', error.message);
        res.status(500).json({ error: 'Error al conectar con Odoo.' });
    }
};

//Obtener todos los proveedores
const get_all_suppliers = async (req, res) => {
    const payload = {
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
                    [['supplier_rank', '>', 0]], // Filtra contactos con supplier_rank mayor a 0
                    ['id', 'name', 'phone', 'email'],
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
            res.json({ success: true, suppliers: response.data.result });
        } else {
            res.status(500).json({ error: 'No se encontraron proveedores.' });
        }
    } catch (error) {
        console.error('Error al conectar con Odoo:', error.message);
        res.status(500).json({ error: 'Error al conectar con Odoo.' });
    }
};


// Eliminar proveedor
const delete_supplier = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'Se requiere un ID de proveedor para desactivar.' });
    }

    const payload = {
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
                'write',
                [[parseInt(id)], { active: false }],
            ],
        },
        id: 1,
    };

    try {
        const response = await axios.post(`${odoo_url}/jsonrpc`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        console.log('RESPONSE', response)
        if (response.data.result) {
            res.json({ success: true, message: `Proveedor con ID ${id} desactivado correctamente.` });
        } else {
            res.status(500).json({ error: 'Error al desactivar el proveedor.' });
        }
    } catch (error) {
        console.error('Error al conectar con Odoo:', error.message);
        res.status(500).json({ error: 'Error al conectar con Odoo.' });
    }
};


// Actualizar proveedor
const update_supplier = async (req, res) => {
    const { id } = req.params;
    const { name, phone, email } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Se requiere un ID de proveedor para modificar.' });
    }

    if (!name && !phone && !email) {
        return res.status(400).json({ error: 'Se requiere al menos un campo para modificar.' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (email) updates.email = email;

    const payload = {
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
                'write',
                [[parseInt(id)], updates],
            ],
        },
        id: 1,
    };

    try {
        const response = await axios.put(`${odoo_url}/jsonrpc`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.data.result) {
            res.json({ success: true, message: `Proveedor con ID ${id} modificado correctamente.` });
        } else {
            res.status(500).json({ error: 'Error al modificar el proveedor.' });
        }
    } catch (error) {
        console.error('Error al conectar con Odoo:', error.message);
        res.status(500).json({ error: 'Error al conectar con Odoo.' });
    }
};

// Obtener un proveedor por ID
const get_supplier = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'Se requiere un ID de proveedor para consultar.' });
    }

    const payload = {
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
                'read',
                [[parseInt(id)], ['id', 'name', 'phone', 'email']],
            ],
        },
        id: 1,
    };

    try {
        const response = await axios.post(`${odoo_url}/jsonrpc`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.data.result) {
            res.json({ success: true, supplier: response.data.result[0] });
        } else {
            res.status(404).json({ error: 'Proveedor no encontrado.' });
        }
    } catch (error) {
        console.error('Error al conectar con Odoo:', error.message);
        res.status(500).json({ error: 'Error al conectar con Odoo.' });
    }
};

module.exports = {
    create_supplier,
    get_all_suppliers,
    delete_supplier,
    update_supplier,
    get_supplier
};
