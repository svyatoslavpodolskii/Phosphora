import struct,zlib
from pathlib import Path
def png(size):
 rows=[]
 for y in range(size):
  row=bytearray()
  for x in range(size):
   px,py=x/size*512,y/size*512
   lit=any((px-a)**2+(py-b)**2<r*r for a,b,r in [(256,174,46),(156,325,29),(358,320,36)])
   for ax,ay,bx,by in [(156,325,256,174),(256,174,358,320),(156,325,358,320)]:
    t=max(0,min(1,((px-ax)*(bx-ax)+(py-ay)*(by-ay))/((bx-ax)**2+(by-ay)**2)))
    lit |= (px-ax-t*(bx-ax))**2+(py-ay-t*(by-ay))**2<49
   row.extend((180,236,193,255) if lit else (16,27,26,255))
  rows.append(b'\0'+row)
 def chunk(tag,data): return struct.pack('!I',len(data))+tag+data+struct.pack('!I',zlib.crc32(tag+data)&0xffffffff)
 return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',size,size,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(rows)))+chunk(b'IEND',b'')
for size in [192,512]: Path(f'public/icon-{size}.png').write_bytes(png(size))
