const API_BASE_URL = 'http://localhost:3000/api';

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

// Función para crear una nueva colección
async function createCollection(userId, name, displayName) {
  try {
    const response = await fetch(`${API_BASE_URL}/collections/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: name.toLowerCase().replace(/\s+/g, '_'),
        displayName: displayName 
      })
    });
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error creating collection:', error);
    return null;
  }
}

// Función para guardar una receta en una colección
async function saveRecipeToCollection(userId, collectionId, recipeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/collections/${userId}/${collectionId}/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId: parseInt(recipeId) })
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error saving recipe to collection:', error);
    return false;
  }
}

// Función para guardar una receta en favoritos
async function saveRecipeToFavorites(userId, recipeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/collections/${userId}/default/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId: parseInt(recipeId) })
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error saving recipe to favorites:', error);
    return false;
  }
}

// Función principal para probar la funcionalidad
async function testFavoritesFunctionality() {
  console.log('🧪 Probando funcionalidad de favoritos y colecciones...');
  
  // Usuario de prueba
  const testUserId = 'user_2abc123'; // Reemplazar con ID real
  const testRecipeId = 1; // Reemplazar con ID de receta real
  
  console.log(`\n👤 Usuario de prueba: ${testUserId}`);
  console.log(`🍳 Receta de prueba: ${testRecipeId}`);
  
  try {
    // 1. Verificar colecciones existentes
    console.log('\n📁 1. Verificando colecciones existentes...');
    const existingCollections = await getUserCollections(testUserId);
    console.log(`   Colecciones encontradas: ${existingCollections.length}`);
    
    for (const collection of existingCollections) {
      console.log(`   - ${collection.name} (${collection.displayName}): ${collection.recipeCount} recetas`);
    }
    
    // 2. Probar guardar en favoritos
    console.log('\n❤️ 2. Probando guardar en favoritos...');
    const savedToFavorites = await saveRecipeToFavorites(testUserId, testRecipeId);
    if (savedToFavorites) {
      console.log('   ✅ Receta guardada en favoritos exitosamente');
    } else {
      console.log('   ❌ Error al guardar en favoritos');
    }
    
    // 3. Crear nueva colección
    console.log('\n📁 3. Probando crear nueva colección...');
    const newCollection = await createCollection(testUserId, 'Postres Favoritos', 'Postres Favoritos');
    if (newCollection) {
      console.log(`   ✅ Nueva colección creada: ${newCollection.name} (ID: ${newCollection.id})`);
      
      // 4. Guardar receta en la nueva colección
      console.log('\n📁 4. Probando guardar receta en nueva colección...');
      const savedToCollection = await saveRecipeToCollection(testUserId, newCollection.id, testRecipeId);
      if (savedToCollection) {
        console.log('   ✅ Receta guardada en nueva colección exitosamente');
      } else {
        console.log('   ❌ Error al guardar en nueva colección');
      }
    } else {
      console.log('   ❌ Error al crear nueva colección');
    }
    
    // 5. Verificar colecciones actualizadas
    console.log('\n📁 5. Verificando colecciones actualizadas...');
    const updatedCollections = await getUserCollections(testUserId);
    console.log(`   Colecciones actualizadas: ${updatedCollections.length}`);
    
    for (const collection of updatedCollections) {
      console.log(`   - ${collection.name} (${collection.displayName}): ${collection.recipeCount} recetas`);
    }
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
  
  console.log('\n✨ Pruebas completadas');
}

// Ejecutar las pruebas
testFavoritesFunctionality().catch(console.error); 