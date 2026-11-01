import sys, subprocess, numpy as np
from scipy.signal import stft
def load(p, ar=22050):
    return np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar',str(ar),'-f','f32le','-'],capture_output=True,check=True).stdout,dtype=np.float32).astype(float)
def chroma(y, sr=22050):
    f,t,X=stft(y,sr,nperseg=4096,noverlap=3072,boundary=None,padded=False); M=np.abs(X); C=np.zeros((12,M.shape[1]))
    for k,fr in enumerate(f):
        if 80<fr<2000: C[int(round(12*np.log2(fr/440)+69))%12]+=M[k]
    return C,t
a=load(sys.argv[1]); b=load(sys.argv[2]); n=min(len(a),len(b)); a=a[:n]; b=b[:n]
Ca,t=chroma(a); Cb,_=chroma(b); m=min(Ca.shape[1],Cb.shape[1]); Ca,Cb=Ca[:,:m],Cb[:,:m]; w=int(2.0/(t[1]-t[0]))
def cos(x,y): return float((x*y).sum()/(np.linalg.norm(x)*np.linalg.norm(y)+1e-12))
sims=[cos(Ca[:,i:i+w].sum(1),Cb[:,i:i+w].sum(1)) for i in range(0,m-w,w)]
sh=int(7/(t[1]-t[0])); base=[cos(Ca[:,i:i+w].sum(1),np.roll(Cb,sh,axis=1)[:,i:i+w].sum(1)) for i in range(0,m-w,w)]
print('windows',len(sims),'chroma cosine original vs chiptune: mean %.2f  min %.2f | same comparison with the chiptune shifted 7 s (chance level): mean %.2f'%(np.mean(sims),np.min(sims),np.mean(base)))
