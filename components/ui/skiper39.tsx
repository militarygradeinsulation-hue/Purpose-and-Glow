"use client";

import { gsap } from "gsap";
import React, { useEffect, useRef } from "react";

interface CrowdCanvasProps {
  src: string;
  rows?: number;
  cols?: number;
}

const CrowdCanvas = ({ src, rows = 15, cols = 7 }: CrowdCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const config = {
      src,
      rows,
      cols,
    };

    // UTILS
    const randomRange = (min: number, max: number) =>
      min + Math.random() * (max - min);
    const randomIndex = (array: any[]) => randomRange(0, array.length) | 0;
    const removeFromArray = (array: any[], i: number) => array.splice(i, 1)[0];
    const removeItemFromArray = (array: any[], item: any) =>
      removeFromArray(array, array.indexOf(item));
    const removeRandomFromArray = (array: any[]) =>
      removeFromArray(array, randomIndex(array));
    const getRandomFromArray = (array: any[]) => array[randomIndex(array) | 0];

    // TWEEN FACTORIES
    const resetPeep = ({ stage, peep }: { stage: any; peep: any }) => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const offsetY = 100 - 250 * gsap.parseEase("power2.in")(Math.random());
      const startY = stage.height - peep.height + offsetY;
      let startX: number;
      let endX: number;

      if (direction === 1) {
        startX = -peep.width;
        endX = stage.width;
        peep.scaleX = 1;
      } else {
        startX = stage.width + peep.width;
        endX = 0;
        peep.scaleX = -1;
      }

      peep.x = startX;
      peep.y = startY;
      peep.anchorY = startY;

      return {
        startX,
        startY,
        endX,
      };
    };

    const normalWalk = ({ peep, props }: { peep: any; props: any }) => {
      const { startX, startY, endX } = props;
      const xDuration = 10;
      const yDuration = 0.25;

      const tl = gsap.timeline();
      tl.timeScale(randomRange(0.5, 1.5));
      tl.to(
        peep,
        {
          duration: xDuration,
          x: endX,
          ease: "none",
        },
        0,
      );
      tl.to(
        peep,
        {
          duration: yDuration,
          repeat: xDuration / yDuration,
          yoyo: true,
          y: startY - 10,
        },
        0,
      );

      return tl;
    };

    const walks = [normalWalk];

    // TYPES
    type Peep = {
      image: HTMLImageElement;
      rect: number[];
      width: number;
      height: number;
      drawArgs: any[];
      x: number;
      y: number;
      anchorY: number;
      scaleX: number;
      walk: any;
      setRect: (rect: number[]) => void;
      render: (ctx: CanvasRenderingContext2D) => void;
    };

    // FACTORY FUNCTIONS
    const createPeep = ({
      image,
      rect,
    }: {
      image: HTMLImageElement;
      rect: number[];
    }): Peep => {
      const peep: Peep = {
        image,
        rect: [],
        width: 0,
        height: 0,
        drawArgs: [],
        x: 0,
        y: 0,
        anchorY: 0,
        scaleX: 1,
        walk: null,
        setRect: (rect: number[]) => {
          peep.rect = rect;
          peep.width = rect[2];
          peep.height = rect[3];
          peep.drawArgs = [peep.image, ...rect, 0, 0, peep.width, peep.height];
        },
        render: (ctx: CanvasRenderingContext2D) => {
          ctx.save();
          ctx.translate(peep.x, peep.y);
          ctx.scale(peep.scaleX, 1);
          ctx.drawImage(
            peep.image,
            peep.rect[0],
            peep.rect[1],
            peep.rect[2],
            peep.rect[3],
            0,
            0,
            peep.width,
            peep.height,
          );
          ctx.restore();
        },
      };

      peep.setRect(rect);
      return peep;
    };

    // MAIN
    const img = document.createElement("img");
    const stage = {
      width: 0,
      height: 0,
    };

    const allPeeps: Peep[] = [];
    const availablePeeps: Peep[] = [];
    const crowd: Peep[] = [];

    const createPeeps = () => {
      const { rows, cols } = config;
      const { naturalWidth: width, naturalHeight: height } = img;
      const total = rows * cols;
      const rectWidth = width / rows;
      const rectHeight = height / cols;

      for (let i = 0; i < total; i++) {
        allPeeps.push(
          createPeep({
            image: img,
            rect: [
              (i % rows) * rectWidth,
              ((i / rows) | 0) * rectHeight,
              rectWidth,
              rectHeight,
            ],
          }),
        );
      }
    };

    const initCrowd = () => {
      while (availablePeeps.length) {
        addPeepToCrowd().walk.progress(Math.random());
      }
    };

    const addPeepToCrowd = () => {
      const peep = removeRandomFromArray(availablePeeps);
      const walk = getRandomFromArray(walks)({
        peep,
        props: resetPeep({
          peep,
          stage,
        }),
      }).eventCallback("onComplete", () => {
        removePeepFromCrowd(peep);
        addPeepToCrowd();
      });

      peep.walk = walk;

      crowd.push(peep);
      crowd.sort((a, b) => a.anchorY - b.anchorY);

      return peep;
    };

    const removePeepFromCrowd = (peep: Peep) => {
      removeItemFromArray(crowd, peep);
      availablePeeps.push(peep);
    };

    const render = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(devicePixelRatio, devicePixelRatio);

      crowd.forEach((peep) => {
        peep.render(ctx);
      });

      ctx.restore();
    };

    const resize = () => {
      if (!canvas) return;
      stage.width = canvas.clientWidth;
      stage.height = canvas.clientHeight;
      canvas.width = stage.width * devicePixelRatio;
      canvas.height = stage.height * devicePixelRatio;

      crowd.forEach((peep) => {
        peep.walk.kill();
      });

      crowd.length = 0;
      availablePeeps.length = 0;
      availablePeeps.push(...allPeeps);

      initCrowd();
    };

    const init = () => {
      createPeeps();
      resize();
      gsap.ticker.add(render);
    };

    img.onload = init;
    img.src = config.src;

    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      gsap.ticker.remove(render);
      crowd.forEach((peep) => {
        if (peep.walk) peep.walk.kill();
      });
    };
  }, []);
  return (
    <canvas ref={canvasRef} className="absolute bottom-0 h-[90vh] w-full" />
  );
};

interface Skiper39Props {
  ctaText?: string;
  subText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  isDarkMode?: boolean;
}

const Skiper39 = ({
  ctaText = "Stand out of the rest of the crowd with Purpose & Glow",
  subText = "A résumé problem is rarely an experience problem. It is almost always a translation problem. While hundreds of applicants submit generic duty lists that blend into the crowd, Nicole Gotsch uncovers the exact metrics and achievements that get you noticed.",
  onPrimaryClick,
  onSecondaryClick,
  isDarkMode = false
}: Skiper39Props) => {
  return (
    <section className={`relative w-full overflow-hidden border-b transition-colors ${
      isDarkMode
        ? "bg-[#0A0C13] border-[#22283A] text-slate-100"
        : "bg-gradient-to-b from-[#FFF5F8] via-[#FFFFFF] to-[#FFF0F5] border-[#F0C6D6] text-slate-900"
    }`}>
      {/* Animated Crowd Canvas Layer */}
      <div
        className="absolute inset-0 pointer-events-none opacity-45 dark:opacity-40 transition-all duration-300"
        style={{ filter: isDarkMode ? 'invert(1) hue-rotate(180deg) brightness(1.2)' : 'none' }}
      >
        <CrowdCanvas
          src="https://cdn.21st.dev/assets/localized/abdb8990a7bef8c2f5af3e45f0a3c969c4b0603fba8be92e81347de4ea4e1ed7.png"
          rows={15}
          cols={7}
        />
      </div>

      {/* Decorative Brand Gradient Grids */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent" />

      {/* Hero Foreground Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 sm:py-24 text-center space-y-6">
        {/* Top Kicker Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C2185B]/30 bg-[#FFF0F5] dark:bg-pink-950/40 text-xs font-semibold tracking-wider uppercase text-[#C2185B] dark:text-pink-300 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#C2185B] animate-pulse" />
          <span>Purpose &amp; Glow Career Solutions · Nicole Gotsch</span>
        </div>

        {/* The Exact User Requested CTA */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif leading-[1.15] max-w-4xl mx-auto">
          Stand out of the rest of the crowd with{" "}
          <span className="text-[#C2185B] dark:text-pink-400 underline decoration-[#C2185B]/40 decoration-wavy decoration-2">
            Purpose &amp; Glow
          </span>
        </h1>

        {/* Clear Subtitle */}
        <p className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${
          isDarkMode ? "text-slate-300" : "text-slate-700 font-normal"
        }`}>
          {subText}
        </p>

        {/* High-Impact Actions */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#contact"
            onClick={(e) => {
              if (onPrimaryClick) {
                e.preventDefault();
                onPrimaryClick();
              }
            }}
            className="px-6 py-3.5 rounded-xl font-semibold text-sm bg-[#C2185B] hover:bg-[#9C1450] text-white transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Begin a Consultation</span>
            <svg className="w-4 h-4 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>

          <a
            href="#portfolio"
            onClick={(e) => {
              if (onSecondaryClick) {
                e.preventDefault();
                onSecondaryClick();
              }
            }}
            className={`px-5 py-3.5 rounded-xl font-semibold text-sm border transition-all inline-flex items-center gap-2 cursor-pointer ${
              isDarkMode
                ? "border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200"
                : "border-slate-300 bg-white/80 hover:bg-white text-slate-800 shadow-2xs"
            }`}
          >
            <span>Explore Résumé Transformations (§ 04)</span>
          </a>
        </div>

        {/* Social Proof Strip */}
        <div className="pt-8 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-[#C2185B] font-bold">12+</span>
            <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>Years Healthcare &amp; Ops Expertise</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-[#C2185B] font-bold">24–48h</span>
            <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>Guaranteed Revamp Turnaround</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-[#C2185B] font-bold">$50 to $239</span>
            <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>100% Transparent Flat Pricing</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export { CrowdCanvas, Skiper39 };
export default Skiper39;
