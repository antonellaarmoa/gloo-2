const API_BASE_URL = 'https://gloo-api-production.up.railway.app/api/v1';

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

// Función para eliminar todas las colecciones problemáticas
async function deleteAllProblematicCollections() {
  console.log('🗑️ Eliminando todas las colecciones problemáticas...');
  
  // Tu userId real
  const testUsers = ['user_2z4Jc0ajOuIlLqZlvYQyJpbY5sx'];
  
  for (const userId of testUsers) {
    console.log(`\n👤 Procesando usuario: ${userId}`);
    
    try {
      const collections = await getUserCollections(userId);
      console.log(`📁 Colecciones encontradas: ${collections.length}`);
      
      let deletedCount = 0;
      
      for (const collection of collections) {
        console.log(`  📁 Verificando: ${collection.name} (${collection.displayName})`);
        
        // Eliminar colecciones "Salty", "Dulce" y "Favoritos" (ya que se crean automáticamente)
        if (collection.name === 'Salty' || collection.name === 'Dulce' || collection.name === 'Favoritos' ||
            collection.displayName === 'Salty' || collection.displayName === 'Dulce' || collection.displayName === 'Favoritos') {
          console.log(`    🗑️ Eliminando colección problemática: ${collection.name}`);
          
          const deleted = await deleteCollection(userId, collection.id);
          if (deleted) {
            console.log(`    ✅ Colección eliminada exitosamente`);
            deletedCount++;
          } else {
            console.log(`    ❌ Error al eliminar la colección`);
          }
        }
      }
      
      console.log(`\n📊 Resumen para usuario ${userId}:`);
      console.log(`  - Colecciones eliminadas: ${deletedCount}`);
      
    } catch (error) {
      console.error(`❌ Error procesando usuario ${userId}:`, error);
    }
  }
  
  console.log('\n✨ Eliminación completada');
}

// Ejecutar la eliminación
deleteAllProblematicCollections().catch(console.error);

// Función para eliminar TODAS las colecciones
async function deleteAllCollections(userId) {
  console.log('🗑️  Deleting ALL collections for user:', userId);
  
  const collections = await getUserCollections(userId);
  console.log('📋 Found collections:', collections.length);
  
  if (collections.length === 0) {
    console.log('✅ No collections to delete');
    return { deleted: 0, collections: [] };
  }
  
  // Mostrar todas las colecciones que se van a eliminar
  collections.forEach((collection, index) => {
    console.log(`${index + 1}. ID: ${collection.id}, Name: "${collection.name}", Display: "${collection.displayName}"`);
  });
  
  // Eliminar todas las colecciones
  let deletedCount = 0;
  for (const collection of collections) {
    console.log(`🗑️  Deleting collection ID ${collection.id} (${collection.name})...`);
    const success = await deleteCollection(userId, collection.id);
    if (success) {
      console.log(`   ✅ Deleted collection ID ${collection.id} (${collection.name})`);
      deletedCount++;
    } else {
      console.log(`   ❌ Failed to delete collection ID ${collection.id}`);
    }
  }
  
  // Verificar que se eliminaron todas
  const remainingCollections = await getUserCollections(userId);
  console.log('📋 Remaining collections:', remainingCollections.length);
  
  if (remainingCollections.length === 0) {
    console.log('✅ All collections deleted successfully!');
  } else {
    console.log('⚠️  Some collections could not be deleted:', remainingCollections);
  }
  
  return { deleted: deletedCount, collections: remainingCollections };
}

// Función para verificar el estado final
async function checkFinalState(userId) {
  const collections = await getUserCollections(userId);
  console.log(`📊 Final state - User ${userId} has ${collections.length} collections`);
  
  if (collections.length === 0) {
    console.log('✅ User is now clean - no collections');
  } else {
    console.log('📋 Remaining collections:');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ID: ${collection.id}, Name: "${collection.name}", Display: "${collection.displayName}"`);
    });
  }
  
  return collections;
}

// Exportar funciones
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    deleteAllCollections, 
    getUserCollections, 
    deleteCollection,
    checkFinalState 
  };
}

// Para uso en navegador
if (typeof window !== 'undefined') {
  window.deleteAllCollections = deleteAllCollections;
  window.checkFinalState = checkFinalState;
  console.log('🔧 Collection deletion functions loaded. Use:');
  console.log('   - deleteAllCollections(userId)');
  console.log('   - checkFinalState(userId)');
} 