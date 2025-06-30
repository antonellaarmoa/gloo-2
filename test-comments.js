// Script de prueba para verificar comentarios
const API_BASE_URL = 'https://gloo-api-production.up.railway.app/api/v1';

async function testAPI() {
  console.log('🧪 Probando conexión con la API...');
  
  try {
    // Primero probar obtener recetas
    console.log('📋 Probando obtener recetas...');
    const recipesResponse = await fetch(`${API_BASE_URL}/recipes`);
    console.log('📡 Status recetas:', recipesResponse.status);
    
    if (recipesResponse.ok) {
      const recipesData = await recipesResponse.json();
      console.log('✅ Recetas obtenidas:', recipesData.data?.length || 0, 'recetas');
      
      if (recipesData.data?.length > 0) {
        const firstRecipe = recipesData.data[0];
        console.log('📋 Primera receta:', { id: firstRecipe.id, title: firstRecipe.title });
        
        // Ahora probar comentarios con esta receta
        console.log(`📝 Probando comentarios para receta ${firstRecipe.id}...`);
        const commentsResponse = await fetch(`${API_BASE_URL}/comments/recipe/${firstRecipe.id}`);
        console.log('📡 Status comentarios:', commentsResponse.status);
        
        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          console.log('✅ Comentarios obtenidos:', commentsData.data?.comments?.length || 0, 'comentarios');
          
          if (commentsData.data?.comments?.length > 0) {
            console.log('📋 Primer comentario:', commentsData.data.comments[0]);
          }
        } else {
          console.log('❌ Error en comentarios:', commentsResponse.status, commentsResponse.statusText);
        }
      }
    } else {
      console.log('❌ Error en recetas:', recipesResponse.status, recipesResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

testAPI(); 