"""Rasterize the rect and M/L/H/V/Z paths used by public/icon.svg. Requires Pillow."""
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[1]/'public'
svg=ET.parse(root/'icon.svg').getroot()
for size,name in [(180,'apple-touch-icon.png'),(192,'icon-192.png'),(512,'icon-512.png')]:
 scale=size*4/192
 image=Image.new('RGBA',(size*4,size*4));draw=ImageDraw.Draw(image)
 for shape in svg:
  tag=shape.tag.split('}')[-1];a=shape.attrib
  if tag=='rect':
   draw.rounded_rectangle((0,0,float(a['width'])*scale,float(a['height'])*scale),radius=float(a.get('rx',0))*scale,fill=a['fill'])
  elif tag=='path':
   tokens=re.findall(r'[MLHVZmlhvz]|-?\d+(?:\.\d+)?',a['d']);i=0;x=y=0;points=[];cmd=''
   while i<len(tokens):
    if tokens[i].isalpha():cmd=tokens[i];i+=1
    if cmd.upper()=='Z':break
    relative=cmd.islower();op=cmd.upper()
    if op in ('M','L'):
     nx,ny=map(float,tokens[i:i+2]);i+=2
     x,y=(x+nx,y+ny) if relative else (nx,ny)
     if op=='M':cmd='l' if relative else 'L'
    elif op=='H':
     nx=float(tokens[i]);i+=1;x=x+nx if relative else nx
    elif op=='V':
     ny=float(tokens[i]);i+=1;y=y+ny if relative else ny
    else:raise ValueError('Unsupported SVG path command')
    points.append((x*scale,y*scale))
   draw.polygon(points,fill=a['fill'])
  else:raise ValueError('Unsupported SVG element')
 image.resize((size,size),Image.Resampling.LANCZOS).save(root/name)
