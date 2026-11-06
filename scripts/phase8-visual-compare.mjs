import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
const report=[];
for(const page of ['home','product','solutions','integrations','pricing','how-it-works'])for(const width of [1440,390]){
 const stem=page+'-'+width+'-1.png';
 const a=await sharp('test-results/phase8/before/'+stem).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const b=await sharp('test-results/phase8/after/'+stem).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let pixels=null,bounds=null;
 if(a.info.width===b.info.width&&a.info.height===b.info.height){pixels=0;let x0=Infinity,y0=Infinity,x1=0,y1=0;for(let i=0;i<a.data.length;i+=4)if(!a.data.subarray(i,i+4).equals(b.data.subarray(i,i+4))){pixels++;const p=i/4,x=p%a.info.width,y=Math.floor(p/a.info.width);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}if(pixels)bounds={x0,y0,x1,y1};}
 report.push({page,width,before:{width:a.info.width,height:a.info.height},after:{width:b.info.width,height:b.info.height},changedPixels:pixels,bounds});
}
await writeFile('test-results/phase8/visual-comparison.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
