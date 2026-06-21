import {
  ArrowRight,
  Box,
  CirclePlay,
  FileText,
  ImageIcon,
  Layers3,
  Monitor,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  WandSparkles,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { Button } from "../components/ui/Button";
import { initializeNewCampaignTask } from "../utils/storageUtils";

const sectionWidth = "w-[min(1180px,calc(100vw-72px))] mx-auto";
const snapshotBase = "/assets/home-snapshot";
const snapshot = (fileName: string) => `${snapshotBase}/${fileName}`;

const flowSteps = [
  { icon: FileText, label: "Brief 输入", index: "01" },
  { icon: Target, label: "内容策略", index: "02" },
  { icon: Layers3, label: "多平台生成", index: "03" },
  { icon: ImageIcon, label: "视觉素材", index: "04" },
  { icon: Monitor, label: "平台预览", index: "05" },
  { icon: ShieldCheck, label: "质量评分", index: "06" },
  { icon: WandSparkles, label: "优化建议", index: "07" },
  { icon: Box, label: "导出发布包", index: "08" },
];

const featureCards = [
  {
    title: "多平台内容资产",
    description: ["生成抖音、小红书、TikTok 与 IG，", "覆盖 Push、Banner 与核心内容资产。"],
    image: snapshot("cutouts/platform.png"),
    imageClass: "h-[170px] w-[218px] scale-[1.08] object-contain",
  },
  {
    title: "视觉素材生成",
    description: ["生成封面、轮播背景与关键帧，", "同步输出 Banner 视觉方向与尺寸。"],
    image: snapshot("cutouts/visual.png"),
    imageClass: "h-[166px] w-[210px] scale-[1.08] object-contain",
  },
  {
    title: "质量评分体系",
    description: ["评估 Hook、平台适配与品牌一致性，", "识别执行难度与内容风险等级。"],
    image: snapshot("cutouts/score.png"),
    imageClass: "h-[168px] w-[186px] scale-[1.06] object-contain",
  },
  {
    title: "导出发布包",
    description: ["整理 Markdown、JSON 与 CSV，", "统一交付素材与归档文件。"],
    image: snapshot("cutouts/export.png"),
    imageClass: "h-[176px] w-[206px] scale-[1.08] object-contain",
  },
];

const metrics = [
  { icon: Zap, label: "高效生成", value: "80%+" },
  { icon: TrendingUp, label: "质量提升", value: "35%+" },
  { icon: Target, label: "精准触达", value: "6+" },
  { icon: ShieldCheck, label: "安全合规", value: "8项" },
];

const panel =
  "relative overflow-hidden border border-cyan-100/15 bg-[linear-gradient(135deg,rgba(9,32,54,0.9),rgba(4,12,28,0.96)_56%,rgba(6,27,45,0.88))] shadow-[0_24px_78px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.06)]";

const assetMaskStyle: CSSProperties = {
  background: "transparent",
  mixBlendMode: "screen",
  opacity: 0.96,
  filter: "brightness(1.14) contrast(1.08) drop-shadow(0 0 24px rgba(72, 230, 255, 0.35))",
  WebkitMaskImage: "radial-gradient(ellipse at center, black 45%, rgba(0,0,0,0.72) 62%, transparent 82%)",
  maskImage: "radial-gradient(ellipse at center, black 45%, rgba(0,0,0,0.72) 62%, transparent 82%)",
};

export function HomePage() {
  return (
    <div className="min-h-screen w-full bg-[#020617] pb-20">
      <section className={`${sectionWidth} relative grid min-h-[500px] grid-cols-1 gap-8 lg:grid-cols-[510px_minmax(0,1fr)] lg:gap-[12px]`}>
        <div className="pointer-events-none absolute left-[-18rem] top-[-12rem] h-[42rem] w-[42rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[-18rem] top-[-10rem] h-[42rem] w-[42rem] rounded-full bg-blue-500/12 blur-3xl" />

        <div className="relative z-10 pt-[22px] lg:pl-[24px]">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[clamp(3.25rem,6.7vw,5.15rem)] font-semibold leading-[1.15] tracking-normal text-white"
          >
            Amap
            <br />
            Campaign
            <br />
            Studio
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-12 whitespace-nowrap text-[clamp(1.7rem,2.7vw,2rem)] font-semibold leading-tight text-white"
          >
            让内容生成从需求到成品更高效
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="mt-4 max-w-[430px] text-[15px] leading-[1.85] text-slate-300"
          >
            从一个 Campaign Brief 自动生成多平台内容、视觉素材、平台预览、质量评分、优化建议与可导出的发布包。
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 flex flex-wrap gap-3"
          >
            <Link to="/brief" onClick={initializeNewCampaignTask}>
              <Button className="h-[54px] min-w-[190px] rounded-lg px-7 !text-[15px] font-semibold shadow-[0_0_34px_rgba(45,212,191,0.22)]">
                <Sparkles size={19} />
                创建内容任务
              </Button>
            </Link>
            <Link to="/pipeline">
              <Button
                variant="secondary"
                className="h-[54px] min-w-[176px] rounded-lg border-cyan-100/26 bg-black/18 px-7 !text-[15px] font-semibold text-white"
              >
                <CirclePlay size={19} />
                查看工作流
              </Button>
            </Link>
          </motion.div>
        </div>

        <HeroPanel />
      </section>

      <WorkflowStrip />

      <section className={`${sectionWidth} mt-[28px] grid gap-5 lg:grid-cols-4`}>
        {featureCards.map((card) => (
          <article key={card.title} className={`${panel} flex aspect-[241/310] flex-col rounded-[18px] px-[26px] pb-[16px] pt-[10px]`}>
            <CardGlow />
            <div className="relative z-10 h-[158px] shrink-0">
              <div className="pointer-events-none absolute inset-x-[-6px] top-0 h-[148px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.18),transparent_64%)] blur-md" />
              <AssetVisual src={card.image} className={card.imageClass} />
            </div>
            <div className="relative z-10 mt-[2px] flex flex-1 flex-col">
              <h2 className="text-center text-[23px] font-semibold leading-tight text-white">{card.title}</h2>
              <p className="mx-auto mt-[13px] max-w-[300px] text-center text-[13px] leading-[1.58] text-slate-300 [text-indent:0]">
                {card.description.map((line) => (
                  <span key={line} className="block whitespace-nowrap">
                    {line}
                  </span>
                ))}
              </p>
              <Link
                to="/assets"
                className="mt-auto flex h-[31px] w-[31px] items-center justify-center rounded-full border border-cyan-100/25 bg-black/16 text-cyan-100 transition hover:border-cyan-200/55 hover:bg-cyan-300/10"
                aria-label={`${card.title}详情`}
              >
                <ArrowRight size={15} />
              </Link>
            </div>
          </article>
        ))}
      </section>

      <SummaryBanner />
    </div>
  );
}

function AssetVisual({ src, className, style }: { src: string; className: string; style?: CSSProperties }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={`pointer-events-none absolute left-1/2 top-1/2 bg-transparent object-contain ${className} -translate-x-1/2 -translate-y-1/2`}
      style={{ ...assetMaskStyle, ...style }}
    />
  );
}

function CardGlow() {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cyan-100/18" />
      <div className="pointer-events-none absolute right-[-54px] top-[-46px] h-36 w-36 rounded-full bg-cyan-400/8 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-full bg-[radial-gradient(circle_at_50%_100%,rgba(45,212,191,0.08),transparent_55%)]" />
    </>
  );
}

function HeroPanel() {
  return (
    <div className="relative z-10 flex justify-center lg:justify-start lg:pt-[48px]">
      <div className="relative h-[436px] w-full max-w-[660px] overflow-hidden rounded-[28px]">
        <div className="pointer-events-none absolute inset-[-36px] rounded-[44px] bg-[radial-gradient(circle_at_55%_52%,rgba(45,212,191,0.2),transparent_57%)] blur-3xl" />
        <div className="pointer-events-none absolute inset-x-8 bottom-[-18px] h-36 rounded-full bg-cyan-400/14 blur-3xl" />
        <div className="pointer-events-none absolute inset-[-1px] rounded-[28px] bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.04),rgba(2,6,23,0.02)_58%,rgba(2,6,23,0.72)_94%,rgba(2,6,23,0.98)_100%)]" />
        <img
          src={snapshot("ChatGPT Image 2026年6月20日 14_23_41 (1).png")}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-[1.085] object-cover opacity-[0.98] drop-shadow-[0_28px_78px_rgba(46,242,255,0.15)]"
          style={{
            mixBlendMode: "screen",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 52%, rgba(0,0,0,0.82) 74%, transparent 98%)",
            maskImage:
              "radial-gradient(ellipse at center, black 52%, rgba(0,0,0,0.82) 74%, transparent 98%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[linear-gradient(90deg,rgba(2,6,23,0.5),transparent_13%,transparent_87%,rgba(2,6,23,0.5)),linear-gradient(180deg,rgba(2,6,23,0.38),transparent_16%,transparent_86%,rgba(2,6,23,0.46))]" />
        <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-cyan-100/6" />
      </div>
    </div>
  );
}

function WorkflowStrip() {
  return (
    <section className={`${sectionWidth} relative mt-[30px]`}>
      <div className={`${panel} rounded-[18px] px-7 py-5`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cyan-100/30" />
        <div className="relative grid grid-cols-2 gap-y-6 sm:grid-cols-4 lg:grid-cols-8 lg:gap-x-3">
          {flowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.index} className="relative flex flex-col items-center text-center">
                <div className="flex h-[54px] w-[54px] items-center justify-center rounded-[11px] border border-cyan-100/20 bg-[#07172c]/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_0_24px_rgba(77,231,216,0.08)]">
                  <Icon size={29} strokeWidth={1.8} className="text-cyan-100" />
                </div>
                <p className="mt-3 text-[13px] font-semibold leading-none text-white">{step.label}</p>
                <p className="mt-3 text-[15px] leading-none text-slate-400">{step.index}</p>
                {index < flowSteps.length - 1 ? (
                  <span className="pointer-events-none absolute right-[-13px] top-[15px] hidden text-[31px] font-light leading-none text-cyan-100/55 lg:block">
                    ›
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SummaryBanner() {
  return (
    <section className={`${sectionWidth} relative mt-[24px]`}>
      <div className={`${panel} grid min-h-[184px] items-center gap-0 rounded-[18px] px-6 py-5 lg:grid-cols-[190px_340px_minmax(0,1fr)]`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cyan-100/28" />
        <div className="relative flex h-[150px] items-center justify-center">
          <div className="pointer-events-none absolute h-[148px] w-[210px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.22),transparent_64%)] blur-md" />
          <AssetVisual
            src={snapshot("cutouts/planet.png")}
            className="h-[148px] w-[210px] object-cover"
            style={{
              WebkitMaskImage: "radial-gradient(ellipse at 38% 54%, black 38%, rgba(0,0,0,0.62) 58%, transparent 76%)",
              maskImage: "radial-gradient(ellipse at 38% 54%, black 38%, rgba(0,0,0,0.62) 58%, transparent 76%)",
            }}
          />
        </div>

        <div className="relative">
          <h2 className="text-[25px] font-semibold leading-tight text-white">AI 驱动的内容运营中枢</h2>
          <p className="mt-5 max-w-[330px] text-[13px] leading-[1.85] text-slate-300">
            连接策略、生成、预览、评分与导出，让每一次 Campaign 更快落地，更易评估。
          </p>
        </div>

        <div className="relative grid grid-cols-4 gap-0">
          {metrics.map(({ icon: Icon, label, value }) => (
            <div key={label} className="border-l border-cyan-100/10 px-4 text-center">
              <Icon className="mx-auto text-cyan-200/80 drop-shadow-[0_0_8px_rgba(77,231,216,0.22)]" size={31} strokeWidth={1.75} />
              <p className="mt-4 text-[13px] font-semibold text-slate-300/90">{label}</p>
              <p className="mt-3 text-[25px] font-semibold leading-none text-white/92">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
