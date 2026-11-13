import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const slides = [
  <img key="0" src="https://images.fillout.com/924155/qtvxhnnszj/generated-images/wJ8m2H8Dv489tK3CsKDRMc/img_lluLe1Isl4TEnAVv.jpg" alt="" className="h-full w-full object-cover" decoding="async" />,
  <img key="1" src="https://images.fillout.com/924155/qtvxhnnszj/generated-images/hNKL129yJ1KTUCFF2TgQnf/img_VrKIsCDi0DY9gOsn.jpg" alt="" className="h-full w-full object-cover" decoding="async" />,
  <img key="2" src="https://images.fillout.com/924155/qtvxhnnszj/generated-images/2XXQRtamSzB7eKGiDe6dMj/img_cusFVbWdCsVdKU7Y.jpg" alt="" className="h-full w-full object-cover" decoding="async" />,
  <img key="3" src="https://images.fillout.com/924155/qtvxhnnszj/generated-images/rNu6bVUixFU7jkHCZAvuSn/img_qmmFG93daB05Qsk4.jpg" alt="" className="h-full w-full object-cover" decoding="async" />,
  <img key="4" src="https://images.fillout.com/924155/qtvxhnnszj/generated-images/sBnyUfSQHxnt9LZQjuzFMU/img_0EGZBG6iXLSNkFKV.jpg" alt="" className="h-full w-full object-cover" decoding="async" />,
  <img key="5" src="https://images.fillout.com/924155/qtvxhnnszj/generated-images/dA3vca96aB2Nb9G2jnNJhA/img_tVoNuewQ6QttJmxN.jpg" alt="" className="h-full w-full object-cover" decoding="async" />,
];

export default function FarmBackground() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 9000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <AnimatePresence>
        <motion.div
          key={i}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        >
          {slides[i]}
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-[hsl(var(--scrim)/var(--scrim-alpha))] transition-colors duration-500" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[hsl(var(--scrim)/var(--scrim-alpha))]" />
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((_, k) => (
          <span key={k} className={`h-1.5 rounded-full transition-all duration-500 ${k === i ? 'w-6 bg-accent' : 'w-1.5 bg-foreground/30'}`} />
        ))}
      </div>
    </div>
  );
}
