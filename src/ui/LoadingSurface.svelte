<script lang="ts">
 import {surface} from './surfaces';
 let {onclose,error=''}:{onclose:()=>void;error?:string}=$props();
</script>
<div class="scrim" use:surface={{close:onclose}}><div class="editor" role="dialog" aria-modal="true" aria-label="Загрузка окна" tabindex="-1"><p role={error?'alert':'status'}>{error||'Открываем…'}</p><button onclick={onclose}>Закрыть</button></div></div>
