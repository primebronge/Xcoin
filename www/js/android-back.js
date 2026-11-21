// Android back button -> game navigation. Native side (MainActivity) calls window.__ludoBack().
// Returns true if the game handled it, false -> app closes (only from splash/home).
window.__ludoBack=function(){
  try{
    var s=document.body.dataset.s,md=document.getElementById('md'),rs=document.getElementById('rs');
    if(md&&md.classList.contains('on')){md.classList.remove('on');return true}
    if(rs&&rs.classList.contains('on')){exitG();return true}
    if(s==='game'){if(md)md.classList.add('on');return true}
    if(s==='onl'){oBack();return true}
    if(s==='lobby'){exitG();return true}
    if(s==='lset'||s==='tset'||s==='set'){sc('home');return true}
    return false;
  }catch(e){return false}
};
