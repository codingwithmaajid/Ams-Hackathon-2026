import React, { useState, useRef, useEffect } from 'react';
import {
  Projection,
  Plan,
  slabOf,
  cylinder,
  insetPlan,
  planOutline,
  lineOnTop,
  topTicks,
  radialTicks,
  knurl,
  corners,
  pointsAt,
  dotGrid,
  topMatrix,
  sideMatrix,
  translateAlong,
  iso,
  segment,
} from '../iso/iso-kit';
import {
  Plate,
  IsoFigure,
  Solid,
  Line,
  Wire,
  Dots,
  FaceText,
} from '../iso/react/draw';
import { useLoop, spring, Spring, useStillness } from '../iso/react/live';

export type MechanismMode = 'brief' | 'corridor' | 'guardrail' | 'approval';

interface ModeSpec {
  id: MechanismMode;
  shortLabel: string;
  readout: string;
  activeFolio: 0 | 1 | 2;
  carriageTargetX: number;
  dialAngleDeg: number;
  guardrailClosed: boolean;
  latchPressed: boolean;
  description: string;
}

const MODES: ModeSpec[] = [
  {
    id: 'brief',
    shortLabel: '01 · 8 AM Brief',
    readout: 'CH 04 · ITEM 12 · ORDER DT 14 MAR · PARA 04 · VERIFIED',
    activeFolio: 0,
    carriageTargetX: -12,
    dialAngleDeg: 38,
    guardrailClosed: false,
    latchPressed: false,
    description:
      'Folio WP 1042/2025 lifts from the chamber rack; optical carriage locks onto para 4 before outbound voice synthesis.',
  },
  {
    id: 'corridor',
    shortLabel: '02 · Corridor Query',
    readout: 'CH 11 · ITEM 27 · AFFIDAVIT · PARA 07 · CITED',
    activeFolio: 1,
    carriageTargetX: 4,
    dialAngleDeg: 115,
    guardrailClosed: false,
    latchPressed: false,
    description:
      'Corridor phone query shifts the scanner head to OSA 88/2024 and reads para 7 verbatim with source attribution.',
  },
  {
    id: 'guardrail',
    shortLabel: '03 · Guardrail Gate',
    readout: 'OPINION QUERY BLOCKED · CITATION GATE CLOSED · SILENCE',
    activeFolio: 2,
    carriageTargetX: 18,
    dialAngleDeg: 210,
    guardrailClosed: true,
    latchPressed: false,
    description:
      'Outcome prediction ("Will we win?") or untrusted opposing claim trips the mechanical shutter, halting unverified speech.',
  },
  {
    id: 'approval',
    shortLabel: '04 · Approval Latch',
    readout: 'TIMELINE UPDATED · WHATSAPP QUEUED · LATCH ENGAGED',
    activeFolio: 0,
    carriageTargetX: -4,
    dialAngleDeg: 300,
    guardrailClosed: false,
    latchPressed: true,
    description:
      'Post-hearing dictation updates the docket drum and holds the client message until the advocate depresses the approval latch.',
  },
];

const WIDTH = 680;
const HEIGHT = 390;

const P: Projection = {
  origin: [340, 212],
  scale: 2.35,
  azimuth: 42,
  elevation: 30,
};

// --- Precomputed Static Geometry in World Units (Computed Once) ---
const plinthPlan: Plan = { x: -72, y: -42, w: 144, d: 84, r: 5 };
const plinthPaths = slabOf(plinthPlan, 0, 5, P, 8, 0.7);
const plinthInset = planOutline(insetPlan(plinthPlan, 3.2), 5, P, 8);
const plinthScrews = pointsAt(
  corners(plinthPlan, 5.5).map(([x, y]) => [x, y, 5]),
  P
);

const rackBasePlan: Plan = { x: -64, y: -32, w: 42, d: 62, r: 2.5 };
const rackBasePaths = slabOf(rackBasePlan, 5, 4, P, 6, 0.5);
const rackWellOutline = planOutline(insetPlan(rackBasePlan, 3), 9, P, 4);

const folioPlan0: Plan = { x: -59, y: -26, w: 32, d: 13, r: 1.2 };
const folioPlan1: Plan = { x: -59, y: -7, w: 32, d: 13, r: 1.2 };
const folioPlan2: Plan = { x: -59, y: 12, w: 32, d: 13, r: 1.2 };

const folio0Paths = slabOf(folioPlan0, 9, 7, P, 4, 0.4);
const folio1Paths = slabOf(folioPlan1, 9, 7, P, 4, 0.4);
const folio2Paths = slabOf(folioPlan2, 9, 7, P, 4, 0.4);

const folio0Rules = [
  lineOnTop([-55, -22], [-33, -22], 16, P),
  lineOnTop([-55, -19.5], [-36, -19.5], 16, P),
  lineOnTop([-55, -17], [-41, -17], 16, P),
].join('');

const folio1Rules = [
  lineOnTop([-55, -3], [-33, -3], 16, P),
  lineOnTop([-55, -0.5], [-35, -0.5], 16, P),
  lineOnTop([-55, 2], [-39, 2], 16, P),
].join('');

const folio2Rules = [
  lineOnTop([-55, 16], [-34, 16], 16, P),
  lineOnTop([-55, 18.5], [-38, 18.5], 16, P),
].join('');

const railPlan: Plan = { x: -16, y: -32, w: 46, d: 24, r: 2 };
const railBasePaths = slabOf(railPlan, 5, 3.5, P, 6, 0.4);
const scaleTicks = topTicks(-10, 24, 2, 5, -12, 8.5, [1.8, 3.4], P, 'x');
const guideGroove1 = lineOnTop([-12, -25], [26, -25], 8.5, P);
const guideGroove2 = lineOnTop([-12, -19], [26, -19], 8.5, P);

const carriagePlan: Plan = { x: -7, y: -28, w: 18, d: 16, r: 1.5 };
const carriagePaths = slabOf(carriagePlan, 8.5, 6.5, P, 6, 0.5);
const carriageLensPaths = cylinder(2, -20, 4.5, 15, 2.5, P, 24, 0.3);
const carriageCrosshair = [
  lineOnTop([-0.5, -20], [4.5, -20], 17.5, P),
  lineOnTop([2, -22.5], [2, -17.5], 17.5, P),
].join('');

const turretPlinthPlan: Plan = { x: -14, y: -2, w: 42, d: 34, r: 3 };
const turretPlinthPaths = slabOf(turretPlinthPlan, 5, 4.5, P, 6, 0.5);
const turretDrumPaths = cylinder(7, 15, 12.5, 9.5, 7, P, 36, 0.6);
const turretKnurl = knurl(7, 15, 12.5, 9.5, 16.5, 28, P, 0.7);
const turretCapPaths = cylinder(7, 15, 8.5, 16.5, 2, P, 28, 0.3);
const dialTicks = radialTicks(7, 15, 7.8, 24, 4, 18.5, [1.2, 2.4], P);

const gatePostBack = slabOf({ x: 31, y: -12, w: 6, d: 5, r: 0.8 }, 5, 15, P, 4, 0.3);
const gatePostFront = slabOf({ x: 31, y: 9, w: 6, d: 5, r: 0.8 }, 5, 15, P, 4, 0.3);
const gateBladePaths = slabOf({ x: 32, y: -7, w: 4, d: 16, r: 0.6 }, 6, 10, P, 4, 0.3);
const gateBladeStripes = [
  segment([34, -4, 9], [34, 6, 9], P),
  segment([34, -4, 12], [34, 6, 12], P),
].join('');

const voiceDeckPlan: Plan = { x: 40, y: -32, w: 26, d: 64, r: 3 };
const voiceDeckPaths = slabOf(voiceDeckPlan, 5, 4, P, 6, 0.5);

const transducerBase = cylinder(53, -15, 9.5, 9, 5.5, P, 32, 0.5);
const transducerKnurl = knurl(53, -15, 9.5, 9, 14.5, 22, P, 0.6);
const transducerRing = cylinder(53, -15, 6.2, 14.5, 2.2, P, 24, 0.3);
const acousticDots = dotGrid(50, -18, 4, 4, 2, 16.7, P);

const latchSocketPlan: Plan = { x: 44, y: 4, w: 18, d: 22, r: 2 };
const latchSocketPaths = slabOf(latchSocketPlan, 9, 3, P, 6, 0.4);
const latchKeyPlan: Plan = { x: 46.5, y: 6.5, w: 13, d: 17, r: 1.5 };
const latchKeyPaths = slabOf(latchKeyPlan, 12, 5.5, P, 6, 0.5);
const latchKeyRules = [
  lineOnTop([49, 12], [57, 12], 17.5, P),
  lineOnTop([49, 15], [55, 15], 17.5, P),
].join('');

const wireRackToScannerFrom = iso([-22, -16, 9], P);
const wireRackToScannerVia = [iso([-18, -16, 9], P)];
const wireRackToScannerTo = iso([-14, -16, 8.5], P);

const wireTurretToGateFrom = iso([19.5, 1, 9.5], P);
const wireTurretToGateVia = [iso([26, 1, 9.5], P)];
const wireTurretToGateTo = iso([31, 1, 9.5], P);

const wireGateToVoiceFrom = iso([37, -6, 9], P);
const wireGateToVoiceVia = [iso([41, -6, 9], P)];
const wireGateToVoiceTo = iso([45, -8, 9], P);

const plinthTextMatrix = sideMatrix([-64, 42], 3.3, P, 'left');
const docketsTextMatrix = topMatrix([-60, -29], 9.1, P, 'x');
const folio0TextMatrix = topMatrix([-55, -24], 16.1, P, 'x');
const folio1TextMatrix = topMatrix([-55, -5], 16.1, P, 'x');
const folio2TextMatrix = topMatrix([-55, 14], 16.1, P, 'x');
const scaleTextMatrix = topMatrix([-13, -29.5], 8.6, P, 'x');
const dialTextMatrix = topMatrix([-11, 28], 9.6, P, 'x');
const voiceTextMatrix = topMatrix([43, -29], 9.1, P, 'x');
const approveTextMatrix = topMatrix([48.5, 19.5], 17.6, P, 'x');
const gateTextMatrix = topMatrix([43, 29], 9.1, P, 'x');

export const ChamberClerkMechanism: React.FC = () => {
  const [mode, setMode] = useState<MechanismMode>('brief');
  const [autoCycle, setAutoCycle] = useState<boolean>(true);
  const [animating, setAnimating] = useState<boolean>(false);
  const calm = useStillness();

  const activeSpec = MODES.find((m) => m.id === mode) ?? MODES[0];

  const springsRef = useRef<{
    folio0Z: Spring;
    folio1Z: Spring;
    folio2Z: Spring;
    carriageX: Spring;
    dialDeg: Spring;
    shutterZ: Spring;
    latchZ: Spring;
  }>({
    folio0Z: { at: 8.5, rate: 0 },
    folio1Z: { at: 0, rate: 0 },
    folio2Z: { at: 0, rate: 0 },
    carriageX: { at: -12, rate: 0 },
    dialDeg: { at: 38, rate: 0 },
    shutterZ: { at: 8.5, rate: 0 },
    latchZ: { at: 0, rate: 0 },
  });

  const [, setTick] = useState(0);

  // Trigger spring settlement loop whenever mode changes
  useEffect(() => {
    setAnimating(true);
  }, [mode]);

  // Idle tour timer (runs only when autoCycle is active and prefers-reduced-motion is false)
  useEffect(() => {
    if (!autoCycle || calm) return;
    const id = window.setInterval(() => {
      setMode((prev) => {
        const idx = MODES.findIndex((m) => m.id === prev);
        return MODES[(idx + 1) % MODES.length].id;
      });
    }, 4500);
    return () => window.clearInterval(id);
  }, [autoCycle, calm]);

  useLoop((dt, isCalm) => {
    const s = springsRef.current;

    const targetF0 = activeSpec.activeFolio === 0 ? 8.5 : 0;
    const targetF1 = activeSpec.activeFolio === 1 ? 8.5 : 0;
    const targetF2 = activeSpec.activeFolio === 2 ? 6.5 : 0;
    const targetCarriage = activeSpec.carriageTargetX;
    const targetDial = activeSpec.dialAngleDeg;
    const targetShutter = activeSpec.guardrailClosed ? 0 : 8.5;
    const targetLatch = activeSpec.latchPressed ? -3.2 : 0;

    const d0 = spring(s.folio0Z, targetF0, dt, 170, 20, isCalm);
    const d1 = spring(s.folio1Z, targetF1, dt, 170, 20, isCalm);
    const d2 = spring(s.folio2Z, targetF2, dt, 170, 20, isCalm);
    const dc = spring(s.carriageX, targetCarriage, dt, 150, 19, isCalm);
    const dd = spring(s.dialDeg, targetDial, dt, 140, 18, isCalm);
    const ds = spring(s.shutterZ, targetShutter, dt, 190, 22, isCalm);
    const dl = spring(s.latchZ, targetLatch, dt, 210, 22, isCalm);

    setTick((t) => (t + 1) % 10000);

    const allSettled = d0 && d1 && d2 && dc && dd && ds && dl;
    if (allSettled) {
      setAnimating(false);
    }
    return !allSettled;
  }, animating);

  const s = springsRef.current;

  // Dynamic rotating pointer needle on the turret top
  const dialRad = (s.dialDeg.at * Math.PI) / 180;
  const needleTip: [number, number] = [
    7 + Math.sin(dialRad) * 6.2,
    15 - Math.cos(dialRad) * 6.2,
  ];
  const needleTail: [number, number] = [
    7 - Math.sin(dialRad) * 2.2,
    15 + Math.cos(dialRad) * 2.2,
  ];
  const needlePath = lineOnTop(needleTail, needleTip, 18.6, P);

  const handleSelectMode = (newMode: MechanismMode) => {
    setAutoCycle(false);
    setMode(newMode);
  };

  return (
    <div className="jolly-anatomy">
      <div className="iso" data-theme="light">
        {/* Interactive Stage Selector Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Inspect clerk verification rig stages"
            className="flex flex-wrap items-center gap-1.5"
          >
            {MODES.map((m) => {
              const active = m.id === mode;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectMode(m.id)}
                  aria-pressed={active}
                  className={`rounded-lg px-3 py-1.5 font-mono text-xs transition-all duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                    active
                      ? 'bg-[#111827] text-[#FBF9F4] shadow-sm'
                      : 'border border-[#111827]/12 bg-[#F6F2E9] text-[#111827]/75 hover:border-[#111827]/30 hover:text-[#111827]'
                  }`}
                >
                  {m.shortLabel}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setAutoCycle((prev) => !prev)}
            className="rounded-lg border border-[#111827]/12 bg-white/80 px-3 py-1.5 font-mono text-[11px] text-[#111827]/70 hover:text-[#111827] transition-colors whitespace-nowrap shrink-0"
          >
            {autoCycle ? 'Auto-tour: On (click to pause)' : 'Auto-tour: Paused (click to resume)'}
          </button>
        </div>

        <Plate
          fig="Fig. 01"
          title="Chamber citation & guardrail rig"
          hint="Click any stage or folio to inspect"
          readout={activeSpec.readout}
          keys={[
            { mark: 'lit', label: 'Active verified assembly' },
            { mark: 'raised', label: 'Indexed chamber folios' },
            { mark: 'dotted', label: 'Signal path (citations required)' },
          ]}
          caption={activeSpec.description}
        >
          <IsoFigure
            width={WIDTH}
            height={HEIGHT}
            label="Interactive isometric diagram of Jolly's citation scanner, guardrail gate, and advocate approval latch"
          >
            {/* 1. Base Plinth */}
            <Solid
              paths={plinthPaths}
              tone="lo"
              crease="faint"
              halo={true}
              inner={<Line d={plinthInset} tone="faint" />}
            />
            <Dots points={plinthScrews} size={0.65} tone="mid" />

            <FaceText transform={plinthTextMatrix} size={2.6} tone="mid">
              JOLLY · CLERK RIG MK-I · CHENNAI
            </FaceText>

            {/* 2. Left Stage: Chamber Docket Rack */}
            <Solid
              paths={rackBasePaths}
              tone="mid"
              crease="faint"
              inner={<Line d={rackWellOutline} tone="faint" />}
            />
            <FaceText transform={docketsTextMatrix} size={2.3} tone="mid">
              01 · DOCKETS
            </FaceText>

            {/* Folio 0 (WP 1042/2025) */}
            <g
              transform={translateAlong(P, [0, 0, s.folio0Z.at])}
              onClick={() => handleSelectMode('brief')}
              className="cursor-pointer"
            >
              <Solid
                paths={folio0Paths}
                tone="hi"
                lit={activeSpec.activeFolio === 0 && !activeSpec.latchPressed}
                inner={<Line d={folio0Rules} tone="mid" free />}
              />
              <FaceText transform={folio0TextMatrix} size={2.3} tone="hi">
                WP 1042 · CH4
              </FaceText>
            </g>

            {/* Folio 1 (OSA 88/2024) */}
            <g
              transform={translateAlong(P, [0, 0, s.folio1Z.at])}
              onClick={() => handleSelectMode('corridor')}
              className="cursor-pointer"
            >
              <Solid
                paths={folio1Paths}
                tone="hi"
                lit={activeSpec.activeFolio === 1}
                inner={<Line d={folio1Rules} tone="mid" free />}
              />
              <FaceText transform={folio1TextMatrix} size={2.3} tone="hi">
                OSA 88 · CH11
              </FaceText>
            </g>

            {/* Folio 2 (Untrusted / Opposing Filing) */}
            <g
              transform={translateAlong(P, [0, 0, s.folio2Z.at])}
              onClick={() => handleSelectMode('guardrail')}
              className="cursor-pointer"
            >
              <Solid
                paths={folio2Paths}
                tone="mid"
                lit={activeSpec.activeFolio === 2}
                inner={<Line d={folio2Rules} tone="lo" free />}
              />
              <FaceText transform={folio2TextMatrix} size={2.2} tone="mid">
                OPP. COUNTER [?]
              </FaceText>
            </g>

            <Wire
              from={wireRackToScannerFrom}
              via={wireRackToScannerVia}
              to={wireRackToScannerTo}
              tone="mid"
              flow={!activeSpec.guardrailClosed}
            />

            {/* 3. Center-Back: Optical Citation Carriage & Scale */}
            <Solid
              paths={railBasePaths}
              tone="mid"
              crease="faint"
              inner={
                <>
                  <Line d={scaleTicks.minor} tone="lo" />
                  <Line d={scaleTicks.major} tone="mid" />
                  <Line d={guideGroove1} tone="faint" />
                  <Line d={guideGroove2} tone="faint" />
                </>
              }
            />
            <FaceText transform={scaleTextMatrix} size={2.2} tone="mid">
              PARA INDEX SCALE
            </FaceText>

            {/* Moving Optical Reader Carriage */}
            <g
              transform={translateAlong(P, [s.carriageX.at, 0, 0])}
              onClick={() => handleSelectMode('corridor')}
              className="cursor-pointer"
            >
              <Solid
                paths={carriagePaths}
                tone="hi"
                lit={mode === 'corridor' || mode === 'brief'}
              />
              <Solid
                paths={carriageLensPaths}
                tone="hi"
                lit={mode === 'corridor' || mode === 'brief'}
                inner={<Line d={carriageCrosshair} tone="hi" />}
              />
            </g>

            {/* 3B. Center-Front: Rotary Citation Turret */}
            <Solid paths={turretPlinthPaths} tone="mid" crease="faint" />
            <g onClick={() => handleSelectMode('brief')} className="cursor-pointer">
              <Solid
                paths={turretDrumPaths}
                tone="hi"
                inner={<Line d={turretKnurl} tone="lo" />}
              />
              <Solid
                paths={turretCapPaths}
                tone="hi"
                inner={
                  <>
                    <Line d={dialTicks.minor} tone="lo" />
                    <Line d={dialTicks.major} tone="mid" />
                    <Line d={needlePath} tone="lit" free />
                  </>
                }
              />
            </g>
            <FaceText transform={dialTextMatrix} size={2.3} tone="mid">
              02 · CITATION DIAL
            </FaceText>

            <Wire
              from={wireTurretToGateFrom}
              via={wireTurretToGateVia}
              to={wireTurretToGateTo}
              tone={activeSpec.guardrailClosed ? 'red' : 'mid'}
              flow={!activeSpec.guardrailClosed}
            />

            {/* 3C. Guardrail Shutter Gate */}
            <Solid paths={gatePostBack} tone="mid" />
            <g
              transform={translateAlong(P, [0, 0, s.shutterZ.at])}
              onClick={() => handleSelectMode('guardrail')}
              className="cursor-pointer"
            >
              <Solid
                paths={gateBladePaths}
                tone="hi"
                lit={activeSpec.guardrailClosed}
                inner={<Line d={gateBladeStripes} tone="mid" />}
              />
            </g>
            <Solid paths={gatePostFront} tone="mid" />

            <Wire
              from={wireGateToVoiceFrom}
              via={wireGateToVoiceVia}
              to={wireGateToVoiceTo}
              tone={activeSpec.guardrailClosed ? 'faint' : 'hi'}
              dotted={activeSpec.guardrailClosed}
              flow={!activeSpec.guardrailClosed}
            />

            {/* 4. Right Stage: Voice Transducer & Approval Latch */}
            <Solid paths={voiceDeckPaths} tone="mid" crease="faint" />

            <g onClick={() => handleSelectMode('brief')} className="cursor-pointer">
              <Solid
                paths={transducerBase}
                tone="hi"
                inner={<Line d={transducerKnurl} tone="lo" />}
              />
              <Solid
                paths={transducerRing}
                tone="hi"
                lit={!activeSpec.guardrailClosed && !activeSpec.latchPressed}
              />
              <Dots
                points={acousticDots}
                size={0.48}
                tone="hi"
                pulse={!activeSpec.guardrailClosed}
              />
            </g>
            <FaceText transform={voiceTextMatrix} size={2.2} tone="mid">
              03 · VOICE LINE
            </FaceText>

            <Solid paths={latchSocketPaths} tone="mid" />
            <g
              transform={translateAlong(P, [0, 0, s.latchZ.at])}
              onClick={() => handleSelectMode('approval')}
              className="cursor-pointer"
            >
              <Solid
                paths={latchKeyPaths}
                tone="hi"
                lit={activeSpec.latchPressed}
                inner={<Line d={latchKeyRules} tone="mid" free />}
              />
              <FaceText transform={approveTextMatrix} size={2.1} tone="hi">
                APPROVE
              </FaceText>
            </g>
            <FaceText transform={gateTextMatrix} size={2.2} tone="mid">
              04 · CLIENT GATE
            </FaceText>
          </IsoFigure>
        </Plate>
      </div>
    </div>
  );
};
