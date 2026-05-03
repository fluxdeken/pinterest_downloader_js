(async function downloadAllImages() {
  // ========== СКРИПТ №1: СБОР ССЫЛОК ==========
  const urls = new Set();
  let lastCount = 0;
  let stagnant = 0;
  let foundStopElement = false;
  
  console.log('🚀 Старт сбора ссылок на картинки...');
  
  function checkForStopElement() {
    const allElements = document.querySelectorAll('*');
    for(const el of allElements) {
      if(el.textContent && el.textContent.trim() === 'Find more ideas') {
        console.log('🛑 Найден элемент "Find more ideas". Останавливаю сбор.');
        return true;
      }
    }
    return false;
  }
  
  function collect() {
    document.querySelectorAll('img[srcset]').forEach(img => {
      const parts = img.srcset.split(',');
      for(const size of ['4x','3x','2x','1x']) {
        const found = parts.find(p => p.trim().endsWith(size));
        if(found) {
          const url = found.trim().split(' ')[0];
          if(url && url.startsWith('http')) urls.add(url);
          break;
        }
      }
    });
    
    if(urls.size !== lastCount) {
      console.log(`📸 Собрано: ${urls.size} ссылок (+${urls.size - lastCount})`);
      lastCount = urls.size;
      stagnant = 0;
    } else {
      stagnant++;
    }
  }
  
  collect();
  let scrollPos = 0;
  let maxScroll = document.documentElement.scrollHeight;
  
  while(stagnant < 8 && scrollPos < maxScroll && !foundStopElement) {
    foundStopElement = checkForStopElement();
    if(foundStopElement) break;
    
    scrollPos += 250;
    window.scrollTo({ top: scrollPos, behavior: 'smooth' });
    await new Promise(r => setTimeout(r, 1000));
    collect();
    maxScroll = document.documentElement.scrollHeight;
  }
  
  if(!foundStopElement) {
    foundStopElement = checkForStopElement();
  }
  
  console.log(`\n✅ Собрано ${urls.size} уникальных ссылок. Начинаю скачивание...\n`);
  
  // ========== СКРИПТ №2: СКАЧИВАНИЕ ==========
  const imageUrls = Array.from(urls);
  let downloaded = 0;
  let failed = 0;
  
  for(let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const fileName = url.split('/').pop().split('?')[0] || `image_${i+1}.jpg`;
    
    try {
      console.log(`📥 [${i+1}/${imageUrls.length}] Скачиваю: ${fileName}`);
      
      const response = await fetch(url);
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      a.click();
      
      URL.revokeObjectURL(blobUrl);
      downloaded++;
      
      await new Promise(r => setTimeout(r, 800));
      
    } catch(err) {
      console.error(`❌ Ошибка: ${fileName} - ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n🎉 ГОТОВО! Скачано: ${downloaded}, Ошибок: ${failed}`);
})();
