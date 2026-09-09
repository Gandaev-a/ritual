import json, os, glob
import numpy as np
from PIL import Image
from scipy import ndimage

os.makedirs('clean', exist_ok=True)
geo={}
for f in sorted(glob.glob('cut/*.png')):
    im=Image.open(f).convert('RGBA')
    a=np.array(im)
    mask=a[:,:,3]>24
    lab,n=ndimage.label(mask)
    if n>1:
        sizes=ndimage.sum(mask,lab,range(1,n+1))
        keep=lab==(int(sizes.argmax())+1)
    else:
        keep=mask
    a[:,:,3]=np.where(keep, a[:,:,3], 0)
    im=Image.fromarray(a)
    bb=im.getbbox(); im=im.crop(bb)
    im.save('clean/'+os.path.basename(f))
    # geometry: bottom edge of the base slab
    a=np.array(im); m=a[:,:,3]>24; H,W=m.shape
    bot=[]
    for x in range(W):
        col=np.nonzero(m[:,x])[0]
        bot.append(int(col.max()) if len(col) else -1)
    geo[os.path.basename(f)[:-4]]={'w':W,'h':H,'bottom':bot}
json.dump(geo, open('geo.json','w'))
print('cleaned', len(geo))
