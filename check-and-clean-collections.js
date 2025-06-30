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

// Función para verificar y limpiar colecciones
async function checkAndCleanCollections() {
  console.log('🔍 Verificando y limpiando colecciones...');
  
  // Lista de usuarios de prueba (ajustar según sea necesario)
  const testUsers = ['user_2abc123', 'user_2def456']; // Reemplazar con IDs reales
  
  for (const userId of testUsers) {
    console.log(`\n👤 Verificando usuario: ${userId}`);
    
    try {
      const collections = await getUserCollections(userId);
      console.log(`📁 Total de colecciones: ${collections.length}`);
      
      let saltyCount = 0;
      let dulceCount = 0;
      let favoritesCount = 0;
      let otherCount = 0;
      
      for (const collection of collections) {
        if (collection.name === 'Salty' || collection.displayName === 'Salty') {
          saltyCount++;
          console.log(`  🧂 Encontrada colección Salty: ${collection.id}`);
        } else if (collection.name === 'Dulce' || collection.displayName === 'Dulce') {
          dulceCount++;
          console.log(`  🍰 Encontrada colección Dulce: ${collection.id}`);
        } else if (collection.name === 'Favoritos' || collection.displayName === 'Favoritos') {
          favoritesCount++;
          console.log(`  ❤️ Encontrada colección Favoritos: ${collection.id}`);
        } else {
          otherCount++;
          console.log(`  📁 Otra colección: ${collection.name} (${collection.displayName})`);
        }
      }
      
      console.log(`\n📊 Resumen para usuario ${userId}:`);
      console.log(`  - Colecciones Salty: ${saltyCount}`);
      console.log(`  - Colecciones Dulce: ${dulceCount}`);
      console.log(`  - Colecciones Favoritos: ${favoritesCount}`);
      console.log(`  - Otras colecciones: ${otherCount}`);
      
      // Eliminar colecciones problemáticas
      if (saltyCount > 0 || dulceCount > 0) {
        console.log(`\n🗑️ Eliminando colecciones problemáticas...`);
        
        for (const collection of collections) {
          if (collection.name === 'Salty' || collection.name === 'Dulce' || 
              collection.displayName === 'Salty' || collection.displayName === 'Dulce') {
            console.log(`  🗑️ Eliminando: ${collection.name} (${collection.displayName})`);
            
            const deleted = await deleteCollection(userId, collection.id);
            if (deleted) {
              console.log(`    ✅ Eliminada exitosamente`);
            } else {
              console.log(`    ❌ Error al eliminar`);
            }
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ Error procesando usuario ${userId}:`, error);
    }
  }
  
  console.log('\n✨ Verificación y limpieza completada');
}

// Ejecutar la verificación y limpieza
checkAndCleanCollections().catch(console.error);

// Función para limpiar colecciones duplicadas
async function cleanDuplicateCollections(userId) {
  console.log('🔍 Checking collections for user:', userId);
  
  const collections = await getUserCollections(userId);
  console.log('📋 Current collections:', collections.length);
  
  if (collections.length === 0) {
    console.log('✅ No collections found - user is clean!');
    return { cleaned: false, collections: [] };
  }
  
  // Mostrar todas las colecciones
  collections.forEach((collection, index) => {
    console.log(`${index + 1}. ID: ${collection.id}, Name: "${collection.name}", Display: "${collection.displayName}"`);
  });
  
  // Agrupar por nombre para encontrar duplicados
  const groupedByName = {};
  collections.forEach(collection => {
    const name = collection.name || collection.displayName;
    if (!groupedByName[name]) {
      groupedByName[name] = [];
    }
    groupedByName[name].push(collection);
  });
  
  // Encontrar duplicados
  const toDelete = [];
  Object.entries(groupedByName).forEach(([name, group]) => {
    if (group.length > 1) {
      console.log(`⚠️  Found ${group.length} collections with name "${name}"`);
      
      // Ordenar por ID (asumiendo que IDs más altos son más recientes)
      group.sort((a, b) => b.id - a.id);
      
      // Mantener el primero (más reciente) y marcar los demás para eliminar
      const toKeep = group[0];
      const duplicates = group.slice(1);
      
      console.log(`   Keeping: ID ${toKeep.id} (${toKeep.name})`);
      console.log(`   Deleting: ${duplicates.map(c => `ID ${c.id}`).join(', ')}`);
      toDelete.push(...duplicates);
    }
  });
  
  // Eliminar duplicados
  if (toDelete.length > 0) {
    console.log(`🗑️  Deleting ${toDelete.length} duplicate collections...`);
    
    for (const collection of toDelete) {
      const success = await deleteCollection(userId, collection.id);
      if (success) {
        console.log(`   ✅ Deleted collection ID ${collection.id} (${collection.name})`);
      } else {
        console.log(`   ❌ Failed to delete collection ID ${collection.id}`);
      }
    }
    
    // Mostrar colecciones finales
    const finalCollections = await getUserCollections(userId);
    console.log('📋 Final collections:', finalCollections.length);
    finalCollections.forEach((collection, index) => {
      console.log(`${index + 1}. ID: ${collection.id}, Name: "${collection.name}", Display: "${collection.displayName}"`);
    });
    
    return { cleaned: true, collections: finalCollections };
  } else {
    console.log('✅ No duplicate collections found');
    return { cleaned: false, collections };
  }
}

// Función para verificar si el usuario tiene colecciones
async function checkUserCollections(userId) {
  const collections = await getUserCollections(userId);
  console.log(`📊 User ${userId} has ${collections.length} collections`);
  
  if (collections.length > 0) {
    console.log('📋 Collections:');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ID: ${collection.id}, Name: "${collection.name}", Display: "${collection.displayName}"`);
    });
  } else {
    console.log('✅ User has no collections');
  }
  
  return collections;
}

// Exportar funciones
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    cleanDuplicateCollections, 
    getUserCollections, 
    deleteCollection,
    checkUserCollections 
  };
}

// Para uso en navegador
if (typeof window !== 'undefined') {
  window.cleanDuplicateCollections = cleanDuplicateCollections;
  window.checkUserCollections = checkUserCollections;
  console.log('🔧 Collection management functions loaded. Use:');
  console.log('   - checkUserCollections(userId)');
  console.log('   - cleanDuplicateCollections(userId)');
} 