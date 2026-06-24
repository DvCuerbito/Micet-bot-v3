// lib/groupConfig.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GROUPS_CONFIG_FILE = path.join(__dirname, '..', 'databases', 'groups_config.json');

// Asegurar que la carpeta databases existe
const ensureDbFolder = () => {
    const dbDir = path.join(__dirname, '..', 'databases');
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
};

// Cargar configuración de grupos
export const loadGroupsConfig = () => {
    try {
        ensureDbFolder();
        if (fs.existsSync(GROUPS_CONFIG_FILE)) {
            const data = fs.readFileSync(GROUPS_CONFIG_FILE, 'utf8');
            return JSON.parse(data);
        }
        return { groups: {} };
    } catch (error) {
        console.error('Error cargando config de grupos:', error);
        return { groups: {} };
    }
};

// Guardar configuración de grupos
export const saveGroupsConfig = (config) => {
    try {
        ensureDbFolder();
        fs.writeFileSync(GROUPS_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error guardando config de grupos:', error);
        return false;
    }
};

// Obtener configuración de un grupo específico
export const getGroupConfig = (groupId) => {
    const config = loadGroupsConfig();
    if (!config.groups[groupId]) {
        config.groups[groupId] = {
            botEnabled: true,
            onlyadmin: false
        };
    }
    return config.groups[groupId];
};

// Actualizar configuración de un grupo
export const updateGroupConfig = (groupId, updates) => {
    const config = loadGroupsConfig();
    if (!config.groups[groupId]) {
        config.groups[groupId] = {
            botEnabled: true,
            onlyadmin: false
        };
    }
    config.groups[groupId] = { ...config.groups[groupId], ...updates };
    saveGroupsConfig(config);
    return config.groups[groupId];
};

console.log('✅ groupConfig.js cargado correctamente');
