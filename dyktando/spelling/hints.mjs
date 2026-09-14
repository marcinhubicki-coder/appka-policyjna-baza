export const RULES = {
  'u/ó':'<strong>U czy Ó?</strong> Spróbuj znaleźć wyraz pokrewny. <b>Ó</b> często wymienia się na <b>o, e</b> lub <b>a</b>. Gdy reguła nie pomaga, zapis warto po prostu zapamiętać.',
  'rz/ż':'<strong>RZ czy Ż?</strong> <b>Rz</b> często wymienia się na <b>r</b> i bywa po spółgłoskach. <b>Ż</b> może wymieniać się m.in. na <b>g, z, s, dz</b>. Szukaj wyrazu z tej samej rodziny.',
  'ch/h':'<strong>CH czy H?</strong> <b>Ch</b> często wymienia się na <b>sz</b> i bardzo często występuje na końcu wyrazu. <b>H</b> spotkasz też w wielu wyrazach obcego pochodzenia.',
  'ć/ci':'<strong>Ć czy CI?</strong> Sprawdź, jaka głoska stoi dalej. Przed samogłoską miękkość często zapisujemy przez <b>ci</b>, a na końcu lub przed spółgłoską częściej przez <b>ć</b>.',
  'ś/si':'<strong>Ś czy SI?</strong> Przed samogłoską miękkość często zapisujemy przez <b>si</b>, a na końcu lub przed spółgłoską częściej przez <b>ś</b>.',
  'ź/zi':'<strong>Ź czy ZI?</strong> Przed samogłoską miękkość często zapisujemy przez <b>zi</b>, a na końcu lub przed spółgłoską częściej przez <b>ź</b>.',
  'ń/ni':'<strong>Ń czy NI?</strong> Przed samogłoską miękkość często zapisujemy przez <b>ni</b>, a na końcu lub przed spółgłoską częściej przez <b>ń</b>.',
};

export function lightbulbSvg(){
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M8.4 15.6c-1.6-1.1-2.7-3-2.7-5.1A6.3 6.3 0 0 1 12 4.2a6.3 6.3 0 0 1 6.3 6.3c0 2.1-1 4-2.7 5.1-.8.6-1.1 1.1-1.1 1.9h-5c0-.8-.3-1.3-1.1-1.9Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

export function mountHintButton(app, answers, category){
  if (!answers || app.querySelector('.spelling-hint')) return;
  const hint=document.createElement('button');
  hint.type='button';
  hint.className='spelling-hint';
  hint.innerHTML=`${lightbulbSvg()}<span>Potrzebujesz podpowiedzi?</span>`;
  hint.addEventListener('click',()=>openHint(app,category));
  answers.insertAdjacentElement('afterend',hint);
}

function openHint(app,category){
  app.querySelector('.spelling-hint-sheet')?.remove();
  const sheet=document.createElement('div');
  sheet.className='spelling-hint-sheet';
  sheet.innerHTML=`<button class="hint-dismiss" type="button" aria-label="Zamknij podpowiedź">×</button><div class="hint-sheet-icon">${lightbulbSvg()}</div><div class="hint-sheet-copy"><span>Podpowiedź</span><p>${RULES[category]||'<strong>Spójrz na rodzinę wyrazów.</strong> Spróbuj przypomnieć sobie podobne słowo i porównać jego zapis.'}</p></div>`;
  app.append(sheet);
  requestAnimationFrame(()=>sheet.classList.add('show'));
  const close=()=>{sheet.classList.remove('show');setTimeout(()=>sheet.remove(),220);};
  sheet.addEventListener('click',e=>{if(e.target===sheet||e.target.closest('.hint-dismiss'))close();});
}
