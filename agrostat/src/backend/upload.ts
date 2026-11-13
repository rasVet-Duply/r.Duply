import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from './firebase';

export function useUpload() {
  const [isUploading, setUploading] = useState(false);
  const upload = async (file: File) => {
    setUploading(true);
    try {
      const uid = auth.currentUser?.uid ?? 'anon';
      const r = ref(storage, `uploads/${uid}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`);
      await uploadBytes(r, file, { contentType: file.type });
      return { url: await getDownloadURL(r) };
    } finally {
      setUploading(false);
    }
  };
  return { upload, isUploading };
}
