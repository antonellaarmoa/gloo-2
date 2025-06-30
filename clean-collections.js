// Script temporal para limpiar colecciones duplicadas
// Ejecutar desde la consola del navegador o como script independiente

const API_BASE_URL = 'http://localhost:3000/api';

// Función para eliminar una colección
async function deleteCollection(userId, collectionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/collections/${userId}/${collectionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting collection:', error);
    return false;
  }
}

// Función para obtener todas las colecciones de un usuario
async function getUserCollections(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/collections/${userId}`);
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}

// Función para limpiar colecciones duplicadas
async function cleanDuplicateCollections(userId) {
  console.log('Cleaning duplicate collections for user:', userId);
  
  const collections = await getUserCollections(userId);
  console.log('Current collections:', collections);
  
  // Agrupar por nombre para encontrar duplicados
  const groupedByName = {};
  collections.forEach(collection => {
    const name = collection.name || collection.displayName;
    if (!groupedByName[name]) {
      groupedByName[name] = [];
    }
    groupedByName[name].push(collection);
  });
  
  // Encontrar duplicados y mantener solo el más reciente
  const toDelete = [];
  Object.entries(groupedByName).forEach(([name, group]) => {
    if (group.length > 1) {
      console.log(`Found ${group.length} collections with name "${name}"`);
      
      // Ordenar por ID (asumiendo que IDs más altos son más recientes)
      group.sort((a, b) => b.id - a.id);
      
      // Mantener el primero (más reciente) y marcar los demás para eliminar
      const toKeep = group[0];
      const duplicates = group.slice(1);
      
      console.log(`Keeping collection ID ${toKeep.id}, deleting:`, duplicates.map(c => c.id));
      toDelete.push(...duplicates);
    }
  });
  
  // Eliminar duplicados
  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} duplicate collections...`);
    
    for (const collection of toDelete) {
      const success = await deleteCollection(userId, collection.id);
      if (success) {
        console.log(`Deleted collection ID ${collection.id} (${collection.name})`);
      } else {
        console.log(`Failed to delete collection ID ${collection.id}`);
      }
    }
  } else {
    console.log('No duplicate collections found');
  }
  
  // Mostrar colecciones finales
  const finalCollections = await getUserCollections(userId);
  console.log('Final collections:', finalCollections);
}

// Función principal para limpiar colecciones
async function cleanCollections() {
  console.log('🧹 Iniciando limpieza de colecciones...');
  
  // Lista de usuarios de prueba (ajustar según sea necesario)
  const testUsers = ['user_2abc123', 'user_2def456']; // Reemplazar con IDs reales
  
  for (const userId of testUsers) {
    console.log(`\n👤 Procesando usuario: ${userId}`);
    
    try {
      const collections = await getUserCollections(userId);
      console.log(`📁 Colecciones encontradas: ${collections.length}`);
      
      for (const collection of collections) {
        console.log(`  - ${collection.name} (${collection.displayName})`);
        
        // Eliminar colecciones "Salty" y "Dulce"
        if (collection.name === 'Salty' || collection.name === 'Dulce' || 
            collection.displayName === 'Salty' || collection.displayName === 'Dulce') {
          console.log(`    🗑️ Eliminando colección: ${collection.name}`);
          
          const deleted = await deleteCollection(userId, collection.id);
          if (deleted) {
            console.log(`    ✅ Colección eliminada exitosamente`);
          } else {
            console.log(`    ❌ Error al eliminar la colección`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error procesando usuario ${userId}:`, error);
    }
  }
  
  console.log('\n✨ Limpieza completada');
}

// Ejecutar la limpieza
cleanCollections().catch(console.error);

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { cleanDuplicateCollections, getUserCollections, deleteCollection };
}

// Si se ejecuta directamente, limpiar colecciones del usuario actual
if (typeof window !== 'undefined') {
  // Para uso en navegador
  window.cleanDuplicateCollections = cleanDuplicateCollections;
} 