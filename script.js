(()=>{
  const $ = id => document.getElementById(id);

  const SUPABASE_URL = 'https://llimufvftbchbvvzlost.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_DbSigByxunWemfRCK7mDkA_r_Zn_GtT';
  const BUCKET = 'gallery-images';

  if (!window.supabase) {
    alert('โหลด Supabase ไม่สำเร็จ กรุณาเช็กอินเทอร์เน็ตแล้วรีเฟรชหน้าเว็บ');
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  let items = [];
  let files = [];
  let viewerItems = [];
  let viewerPos = 0;
  let filter = 'all';
  let isBusy = false;

  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  const visible = zone => items.filter(x => x.is_visible !== false && (zone ? x.zone === zone : true));

  const repeat = (arr, min = 10) => {
    if (!arr.length) return [];
    const out = [];
    while (out.length < min) out.push(...arr);
    return out;
  };

  const publicUrl = path => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  async function fetchItems(){
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    items = data || [];
  }

  async function refresh(){
    try {
      await fetchItems();
      render();
      renderManager();
      $('empty').classList.toggle('hidden', items.length > 0);
    } catch (err) {
      console.error('Cloud refresh failed:', err);
      alert('โหลด Gallery จาก Cloud ไม่สำเร็จ');
    }
  }

  function card(it, i, cls = 'piece'){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.innerHTML = `<img src="${publicUrl(it.image_path)}" alt="${esc(it.title || 'ภาพ')}"><small>${String(i+1).padStart(3,'0')} ${esc(it.title)}</small>`;
    b.addEventListener('click', () => openViewer(it));
    return b;
  }

  function render(){
    ['museumGallery','natureA','natureB','petsA','petsB','familyFeature','familyFilm','memoryGallery','tunnel','finaleCloud','heroFloat']
      .forEach(id => $(id).innerHTML = '');

    const museum = visible('museum');
    museum.forEach((it,i) => $('museumGallery').appendChild(card(it,i)));

    const nature = repeat(visible('nature'),12);
    nature.forEach((it,i) => {
      const c = card(it,i,'diag-card');
      (i % 2 ? $('natureB') : $('natureA')).appendChild(c);
    });

    const pets = repeat(visible('pets'),12);
    pets.forEach((it,i) => {
      const c = card(it,i,'polaroid');
      c.style.setProperty('--r', `${(i%5-2)*2.4}deg`);
      (i % 2 ? $('petsB') : $('petsA')).appendChild(c);
    });

    const family = visible('family');
    if (family[0]) {
      const x = document.createElement('button');
      x.type = 'button';
      x.className = 'family-large';
      x.innerHTML = `<img src="${publicUrl(family[0].image_path)}" alt="${esc(family[0].title || 'ภาพ')}">`;
      x.addEventListener('click', () => openViewer(family[0]));
      $('familyFeature').appendChild(x);
    }
    repeat(family,12).forEach((it,i) => $('familyFilm').appendChild(card(it,i,'film')));

    const memories = visible('memories');
    memories.slice(0,8).forEach((it,i) => {
      const c = card(it,i,'scrap');
      c.style.setProperty('--r', `${(i%5-2)*3}deg`);
      $('memoryGallery').appendChild(c);
    });

    const featured = items.filter(x => x.is_visible !== false && x.is_featured);
    const hero = (featured.length ? featured : items.filter(x => x.is_visible !== false)).slice(0,3);
    hero.forEach((it,i) => $('heroFloat').appendChild(card(it,i,'hero-card')));

    const tunnel = repeat(items.filter(x => x.is_visible !== false),9).slice(0,9);
    tunnel.forEach((it,i) => {
      const c = card(it,i,'tunnel-card');
      c.dataset.i = i;
      $('tunnel').appendChild(c);
    });

    const finale = items.filter(x => x.is_visible !== false && x.show_in_finale !== false);
    const positions = [[5,18],[20,7],[40,15],[66,8],[82,22],[8,62],[25,72],[47,65],[70,73],[86,60],[16,38],[74,40],[37,82],[58,35]];
    repeat(finale,14).slice(0,14).forEach((it,i) => {
      const c = card(it,i,'final-card');
      const pos = positions[i];
      c.style.left = pos[0] + '%';
      c.style.top = pos[1] + '%';
      c.style.animationDelay = `-${i*.35}s`;
      $('finaleCloud').appendChild(c);
    });
  }

  async function updateItem(id, patch){
    const { error } = await supabase.from('photos').update(patch).eq('id', id);
    if (error) throw error;
  }

  async function deleteItem(it){
    if (it.image_path) {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([it.image_path]);
      if (storageError) console.warn('Storage delete warning:', storageError);
    }
    const { error } = await supabase.from('photos').delete().eq('id', it.id);
    if (error) throw error;
  }

  function renderManager(){
    const list = items.filter(x => filter === 'all' ? true : filter === 'hidden' ? x.is_visible === false : x.zone === filter);
    $('stats').textContent = `${items.length} รูป · ${items.filter(x=>x.is_visible!==false).length} แสดง · ${items.filter(x=>x.is_visible===false).length} ซ่อน`;
    $('managerGrid').innerHTML = '';

    list.forEach(it => {
      const d = document.createElement('div');
      d.className = 'manage-card' + (it.is_visible === false ? ' hidden-photo' : '');
      d.innerHTML = `
        <img src="${publicUrl(it.image_path)}" alt="${esc(it.title || 'ภาพ')}">
        <div class="manage-meta"><b>${esc(it.title) || 'Untitled'}</b><span>${it.is_featured ? '★ ' : ''}${esc(it.zone)}</span></div>
        <div class="manage-controls">
          <button data-act="show">${it.is_visible === false ? 'Show' : 'Hide'}</button>
          <button data-act="feature">${it.is_featured ? '★ Featured' : '☆ Featured'}</button>
          <select data-act="zone">
            <option value="museum">Museum</option><option value="nature">Nature</option><option value="pets">Pets</option><option value="family">Family</option><option value="memories">Memories</option>
          </select>
          <button data-act="finale">${it.show_in_finale === false ? 'Finale Off' : 'Finale On'}</button>
          <button data-act="edit">Edit</button>
          <button class="danger" data-act="delete">Delete</button>
        </div>`;

      const zoneSelect = d.querySelector('[data-act="zone"]');
      zoneSelect.value = it.zone || 'museum';

      d.querySelector('[data-act="show"]').addEventListener('click', async () => {
        await updateItem(it.id, { is_visible: it.is_visible === false });
        await refresh();
      });
      d.querySelector('[data-act="feature"]').addEventListener('click', async () => {
        await updateItem(it.id, { is_featured: !it.is_featured });
        await refresh();
      });
      zoneSelect.addEventListener('change', async () => {
        await updateItem(it.id, { zone: zoneSelect.value });
        await refresh();
      });
      d.querySelector('[data-act="finale"]').addEventListener('click', async () => {
        await updateItem(it.id, { show_in_finale: it.show_in_finale === false });
        await refresh();
      });
      d.querySelector('[data-act="edit"]').addEventListener('click', async () => {
        const title = prompt('ชื่อภาพ', it.title || '');
        if (title === null) return;
        const date = prompt('วันที่ / ปี', it.photo_date || '');
        if (date === null) return;
        await updateItem(it.id, { title, photo_date: date });
        await refresh();
      });
      d.querySelector('[data-act="delete"]').addEventListener('click', async () => {
        if (!confirm('ลบรูปนี้ถาวรหรือไม่?')) return;
        await deleteItem(it);
        await refresh();
      });

      $('managerGrid').appendChild(d);
    });
  }

  function modal(id, on = true){ $(id).classList.toggle('open', on); }
  $('addBtn').addEventListener('click', () => modal('uploadModal'));
  $('emptyAdd').addEventListener('click', () => modal('uploadModal'));
  $('settingsBtn').addEventListener('click', () => { renderManager(); modal('settingsModal'); });
  document.querySelectorAll('[data-close]').forEach(x => x.addEventListener('click', () => modal(x.dataset.close, false)));
  document.querySelectorAll('.modal').forEach(x => x.addEventListener('click', e => { if (e.target === x) x.classList.remove('open'); }));

  $('files').addEventListener('change', () => {
    files = [...$('files').files].filter(f => f.type.startsWith('image/'));
    $('previews').innerHTML = '';
    files.slice(0,15).forEach(f => {
      const im = document.createElement('img');
      const x = URL.createObjectURL(f);
      im.src = x;
      im.onload = () => URL.revokeObjectURL(x);
      $('previews').appendChild(im);
    });
  });

  function resizeImage(file, maxSide = 2200, quality = .88){
    return new Promise(resolve => {
      if (!file.type.startsWith('image/') || file.type === 'image/gif') return resolve({ blob:file, ext:(file.name.split('.').pop()||'jpg').toLowerCase() });
      const img = new Image();
      const src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(src);
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
        canvas.toBlob(blob => resolve(blob ? { blob, ext:'webp' } : { blob:file, ext:(file.name.split('.').pop()||'jpg').toLowerCase() }), 'image/webp', quality);
      };
      img.onerror = () => { URL.revokeObjectURL(src); resolve({ blob:file, ext:(file.name.split('.').pop()||'jpg').toLowerCase() }); };
      img.src = src;
    });
  }

  $('uploadForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (!files.length) return alert('เลือกรูปก่อน');
    if (isBusy) return;
    isBusy = true;

    const submit = e.submitter;
    const oldLabel = submit ? submit.textContent : '';
    if (submit) { submit.disabled = true; submit.textContent = 'กำลังอัปโหลด…'; }

    const baseTitle = $('title').value.trim();
    const meta = $('meta').value.trim();
    const zone = $('zone').value;
    const display = $('display').value;
    const featured = $('featured').checked;
    const finale = $('inFinale').checked;
    let success = 0;

    try {
      for (let i=0; i<files.length; i++) {
        const original = files[i];
        const processed = await resizeImage(original);
        const safe = `${Date.now()}-${Math.random().toString(36).slice(2,10)}.${processed.ext}`;

        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(safe, processed.blob, { cacheControl:'31536000', upsert:false });
        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { error: insertError } = await supabase.from('photos').insert({
          image_path: safe,
          title: baseTitle || original.name.replace(/\.[^.]+$/,''),
          photo_date: meta || null,
          zone,
          display_style: display,
          is_visible: true,
          is_featured: featured,
          show_in_finale: finale,
          sort_order: items.length + i
        });

        if (insertError) {
          console.error('Database insert error:', insertError);
          await supabase.storage.from(BUCKET).remove([safe]);
          continue;
        }
        success++;
      }

      if (!success) return alert('อัปโหลดไม่สำเร็จ กรุณาตรวจ Policy ของ Supabase');

      files = [];
      $('uploadForm').reset();
      $('inFinale').checked = true;
      $('previews').innerHTML = '';
      modal('uploadModal', false);
      await refresh();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดระหว่างอัปโหลด');
    } finally {
      isBusy = false;
      if (submit) { submit.disabled = false; submit.textContent = oldLabel; }
    }
  });

  $('filters').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    filter = b.dataset.filter;
    document.querySelectorAll('.filters button').forEach(x => x.classList.toggle('active', x === b));
    renderManager();
  });

  $('previewBtn').addEventListener('click', () => {
    document.body.classList.toggle('preview-mode');
    $('previewBtn').textContent = document.body.classList.contains('preview-mode') ? '✎ Edit mode' : '👁 Preview';
  });

  function openViewer(it){
    viewerItems = items.filter(x => x.is_visible !== false);
    viewerPos = Math.max(0, viewerItems.findIndex(x => x.id === it.id));
    showViewer();
    $('viewer').classList.add('open');
  }

  function showViewer(){
    if (!viewerItems.length) return;
    const it = viewerItems[viewerPos];
    $('viewerImg').src = publicUrl(it.image_path);
    $('viewerNo').textContent = String(viewerPos+1).padStart(3,'0');
    $('viewerTitle').textContent = it.title || '';
    $('viewerMeta').textContent = it.photo_date || '';
  }

  $('viewerClose').addEventListener('click', () => $('viewer').classList.remove('open'));
  $('viewerPrev').addEventListener('click', () => { viewerPos = (viewerPos-1+viewerItems.length)%viewerItems.length; showViewer(); });
  $('viewerNext').addEventListener('click', () => { viewerPos = (viewerPos+1)%viewerItems.length; showViewer(); });

  let t = 0;
  function animate(){
    t += .008;
    document.querySelectorAll('.tunnel-card').forEach((c,i) => {
      const a=t+i*.7, z=(Math.sin(a)+1)/2, x=Math.cos(a*.7+i)*innerWidth*.24, y=Math.sin(a*.9+i)*innerHeight*.18, s=.45+z*.8;
      c.style.transform=`translate(-50%,-50%) translate3d(${x}px,${y}px,${z*350}px) rotate(${Math.sin(a)*6}deg) scale(${s})`;
      c.style.zIndex=Math.round(z*100);
    });
    requestAnimationFrame(animate);
  }
  animate();
  refresh();
})();
