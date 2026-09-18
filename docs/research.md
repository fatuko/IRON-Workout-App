# IRON Research Library

This document is the evidence base for IRON's progression engine. Every rule the engine applies traces back to a paper listed here. The engine never reads these papers at runtime; they inform the constants and decision logic in `api/app/services/progression.py`, and each suggestion carries the citation keys of the rules it applied.

Maintained by: Olakiite Fatukasi
Last updated: September 2026

## How to read this document

Each entry has:

- **Key**: the identifier used in `citations.json` and in code (`basis` fields)
- **Citation**: full reference with DOI
- **Access**: whether we read the full text, only the abstract, or neither
- **Finding**: what the paper actually showed, in our words
- **Rule for IRON**: the concrete thing the engine does because of this paper
- **Caveats**: limits on how far the finding should be pushed

When a paper is superseded, keep the entry and add a `Superseded by` line rather than deleting it. The history of why a rule changed is useful.

## Priority order

Meta-analyses and meta-regressions set defaults. Single trials refine or caveat them. Preprints are cited as preprints. When two papers conflict, the more recent meta-regression wins unless it has a stated limitation that the older paper does not.

## Verify before citing

One entry in an earlier draft of this document was wrong in a way worth guarding against: a finding stated in a paper's *introduction*, citing someone else's work, was attributed to that paper itself. The Journal of Human Kinetics velocity paper was listed as the basis for down-weighting high-rep 1RM estimates, but that finding is Reynolds et al. (2006), which the velocity paper only cites.

So: before an entry's finding is treated as settled, confirm it is that paper's own result and not one it references. Entries marked `access: abstract` are especially exposed to this, because abstracts and introductions both summarize other people's work. Any entry whose access line is not "full text" should be treated as provisional.

---

## Volume

### pelland2026

**Citation:** Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC. The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains. *Sports Medicine*. 2026;56(2):481-505. https://doi.org/10.1007/s40279-025-02344-w

Free preprint: https://sportrxiv.org/index.php/server/preprint/view/460
Data and code: https://osf.io/6z3xu

**Access:** Full text (open access)

**Finding:** 67 studies, 2,058 participants. Both hypertrophy and strength increase with weekly set volume, but with diminishing returns. The diminishing returns are much stronger for strength, which follows a reciprocal curve with a functional plateau. Hypertrophy follows a square-root curve that keeps rising, just more slowly. Frequency has a negligible independent effect on hypertrophy once volume is equated, but a real effect on strength with diminishing returns. The "fractional" volume counting method, where indirect sets (synergist work) count as 0.5 of a set, predicted outcomes better than counting them as 1.0 or 0.

Useful anchors from the included studies: median volume for hypertrophy effects was 10.5 fractional sets per muscle per week at 2 sessions per week; median for strength effects was 6 sets per week.

**Rules for IRON:**
- Count volume fractionally. A set counts 1.0 for the primary muscle and 0.5 for each secondary muscle.
- Hypertrophy goal: do not cap volume suggestions. Flag volume as low if a muscle group is well under the 10-set anchor.
- Strength goal: volume plateaus. Beyond a moderate weekly set count, suggest adding frequency or load rather than sets.
- Frequency: for hypertrophy, split choice does not matter once volume is equated. For strength, more sessions per movement per week helps.

**Schema requirement:** `movements` needs a `secondary_muscles` array for fractional counting to work.

**Caveats:** The 0.5 weighting for indirect sets is a heuristic the authors themselves call an assumption. Participants averaged 25 years old and 79% male. The exact strength plateau value is in the paper's Table 4 and should be read directly before hardcoding a threshold.

---

### remmert2025

**Citation:** Remmert JF, Pelland JC, Robinson ZP, Hinson SR, Zourdos MC. Meta-Regressions of the Effect of Per-Session Volume on Hypertrophy and Strength. *SportRxiv* preprint. 2025. https://sportrxiv.org/index.php/server/preprint/view/537

**Access:** Abstract

**Finding:** Companion paper to pelland2026 looking at sets per session rather than per week. Identifies a "point of undetectable outcome superiority": the per-session set count beyond which additional sets stop producing a likely-meaningful difference.

**Rule for IRON:** Cap the number of sets suggested for one muscle group in a single session. The specific number requires reading the full preprint.

**Caveats:** Preprint, not peer reviewed. Full text not yet read; the cap value is a placeholder until it is.

---

### schoenfeld2017

**Citation:** Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training volume and increases in muscle mass: a systematic review and meta-analysis. *Journal of Sports Sciences*. 2017;35(11):1073-1082. https://doi.org/10.1080/02640414.2016.1210197

**Access:** Abstract

**Finding:** Earlier volume meta-analysis. Graded dose-response between weekly sets and hypertrophy; 10+ sets per week produced more growth than fewer, but the authors could not draw conclusions above ~9 sets because of limited data at the time.

**Rule for IRON:** None independently.

**Superseded by:** pelland2026

---

## Proximity to failure (RIR)

### robinson2024

**Citation:** Robinson ZP, Pelland JC, Remmert JF, Refalo MC, Jukic I, Steele J, Zourdos MC. Exploring the Dose-Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy: A Series of Meta-Regressions. *Sports Medicine*. 2024;54(9):2209-2231. https://doi.org/10.1007/s40279-024-02069-2

Data and code: https://osf.io/7knsj/

**Access:** Abstract (full text paywalled)

**Finding:** RIR modeled as a continuous variable rather than failure vs. not-failure. For strength, the relationship with RIR was negligible: gains were similar across a wide RIR range. For hypertrophy, the slopes were negative and did not include zero: muscle growth increased as sets were terminated closer to failure. The authors explicitly call the analysis exploratory and note that RIR was estimated from study descriptions, not measured.

**Rules for IRON:**
- Hypertrophy goal: target 0-2 RIR. If recent sets average above the target, suggest more load or reps.
- Strength goal: RIR is not the primary lever. Accept 1-4 RIR; drive progression through load.
- User-facing copy should say closer to failure tends to help growth, not that failure is required.

**Caveats:** Exploratory meta-regression of estimated RIR. Modest model fit by the authors' own assessment. This is the single most important paper for the engine and also the one with the most explicit uncertainty. Worth obtaining the full text through RPI's library access before finalizing the RIR targets.

---

### zourdos2016

**Citation:** Zourdos MC, Klemp A, Dolan C, et al. Novel Resistance Training-Specific Rating of Perceived Exertion Scale Measuring Repetitions in Reserve. *Journal of Strength and Conditioning Research*. 2016;30(1):267-275. https://doi.org/10.1519/JSC.0000000000001049

**Access:** Not yet read

**Finding:** Establishes the RIR-based RPE scale that IRON's effort input is built on. Also reports that stronger load-velocity relationships exist in trained lifters than in novices, which is consistent with novices being less able to judge their own proximity to failure.

**Rule for IRON:** Defines the scale. No engine constant, but this is the citation for why RIR exists in the app at all.

---

## Load and rep ranges

### currier2023

**Citation:** Currier BS, Mcleod JC, Banfield L, et al. Resistance training prescription for muscle strength and hypertrophy in healthy adults: a systematic review and Bayesian network meta-analysis. *British Journal of Sports Medicine*. 2023;57(18):1211-1220. https://doi.org/10.1136/bjsports-2023-106807

Free full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC10579494/

**Access:** Abstract

**Finding:** Network meta-analysis of 178 strength studies and 119 hypertrophy studies. Higher-load prescriptions (above 80% 1RM) maximized strength gains. All load prescriptions promoted hypertrophy comparably.

**Rules for IRON:**
- Strength goal: bias suggestions toward loads at or above 80% of estimated 1RM. In practice, prefer adding weight over adding reps.
- Hypertrophy goal: load is not the lever. Respect the user's rep range fully and suggest changes only within it.

**Caveats:** Healthy adults, mixed training status.

---

### schoenfeld2021

**Citation:** Schoenfeld BJ, Grgic J, Van Every DW, Plotkin DL. Loading Recommendations for Muscle Strength, Hypertrophy, and Local Endurance: A Re-Examination of the Repetition Continuum. *Sports*. 2021;9(2):32. https://doi.org/10.3390/sports9020032

Free full text: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7927075/

**Access:** Abstract

**Finding:** The traditional repetition continuum (heavy for strength, moderate for size, light for endurance) is not well supported. Hypertrophy can be achieved across a wide load spectrum when sets approach failure. Strength does favor heavier loads.

**Rule for IRON:** Same as currier2023. The user's rep range is a legitimate choice, not something the app should correct.

---

### lopez2021

**Citation:** Lopez P, Radaelli R, Taaffe DR, et al. Resistance Training Load Effects on Muscle Hypertrophy and Strength Gain: Systematic Review and Network Meta-analysis. *Medicine and Science in Sports and Exercise*. 2021;53(6):1206-1216. https://doi.org/10.1249/MSS.0000000000002585

**Access:** Not yet read

**Finding:** Network meta-analysis confirming load-independence of hypertrophy.

**Rule for IRON:** Supporting citation for schoenfeld2021 and currier2023.

---

## Frequency

### schoenfeld2016

**Citation:** Schoenfeld BJ, Ogborn D, Krieger JW. Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-Analysis. *Sports Medicine*. 2016;46(11):1689-1697. https://doi.org/10.1007/s40279-016-0543-8

**Access:** Abstract

**Finding:** Training a muscle twice per week produced more hypertrophy than once per week on a volume-equated basis. Whether three times beats two was undetermined.

**Rule for IRON:** When a user builds a split, warn if any muscle group is trained fewer than 2 times per week.

---

### schoenfeld2019

**Citation:** Schoenfeld BJ, Grgic J, Krieger J. How many times per week should a muscle be trained to maximize muscle hypertrophy? A systematic review and meta-analysis of studies examining the effects of resistance training frequency. *Journal of Sports Sciences*. 2019;37(11):1286-1295. https://doi.org/10.1080/02640414.2018.1555906

**Access:** Abstract

**Finding:** When weekly volume is equated, frequency has no meaningful effect on hypertrophy.

**Rule for IRON:** Do not rank splits against each other for hypertrophy. PPL vs Upper/Lower vs Full Body is a preference once volume is matched.

**Caveats:** For strength, pelland2026 finds frequency does matter. The two are not in conflict; they measure different outcomes.

---

## Fatigue and recovery

### moran_navarro2017

**Citation:** Morán-Navarro R, Pérez CE, Mora-Rodríguez R, et al. Time course of recovery following resistance training leading or not to failure. *European Journal of Applied Physiology*. 2017;117(12):2387-2399. https://doi.org/10.1007/s00421-017-3725-7

**Access:** Abstract

**Finding:** Training to failure caused a significantly larger acute drop in neuromuscular performance than non-failure training at equal volume, and recovery from non-failure protocols was faster at 24-48h.

**Rule for IRON:** If a muscle group has 2 or more sets logged at 0 RIR in a session, require at least 48 hours before the split rotation surfaces that muscle group again.

---

### pareja_blanco2020

**Citation:** Pareja-Blanco F, Rodríguez-Rosell D, Aagaard P, et al. Time Course of Recovery From Resistance Exercise With Different Set Configurations. *Journal of Strength and Conditioning Research*. 2020;34(10):2867-2876. https://doi.org/10.1519/JSC.0000000000002756

**Access:** Abstract

**Finding:** Sets to failure, especially high-rep ones, produced mechanical deficits that persisted up to 48 hours.

**Rule for IRON:** Supports the 48-hour rule in moran_navarro2017. High-rep failure sets are the worst case for recovery.

---

### belcher2019

**Citation:** Belcher DJ, Sousa CA, Carzoli JP, et al. Time course of recovery is similar for the back squat, bench press, and deadlift in well-trained males. *Applied Physiology, Nutrition, and Metabolism*. 2019;44(10):1033-1042. https://doi.org/10.1139/apnm-2019-0004

**Access:** Abstract

**Finding:** Squat, bench, and deadlift performed to failure recovered on similar timelines when assessed at 24, 48, 72, and 96 hours.

**Rule for IRON:** Use one recovery rule per muscle group rather than per-lift recovery windows.

**Caveats:** Twelve well-trained males. Do not generalize the exact timelines to beginners.

---

## 1RM estimation

### marzagao2026

**Citation:** Marzagão T. A Weight-Dependent 1RM Prediction Equation Optimized on 303,494 Near-Failure Sets Across 388 Exercises. *arXiv* preprint. 2026. https://arxiv.org/abs/2603.17495

Also on SportRxiv: https://sportrxiv.org/index.php/server/preprint/view/768

**Access:** Abstract and partial text

**Finding:** Classical formulas (Epley, Brzycki, Wathen, Mayhew) use one fixed conversion factor for every exercise and were derived mostly from bench press in small samples. Using 303,494 near-failure sets across 388 exercises, the author fit a formula where the conversion factor varies with the weight lifted:

```
1RM = w * (1 + (r - 1)^0.85 / (-2.55 + 4.58 * ln(w)))
```

where w is weight in kilograms and r is reps. At light weights each extra rep implies a larger fraction of max than at heavy weights. Reduced inconsistency by 17-22% versus the four classical formulas, with improvement on every exercise tested. Five-fold cross-validation showed near-zero overfitting.

**Rules for IRON:**
- Use this formula for `estimated_1rm`, computed at write time.
- Weight must be converted to kilograms before computing. `ln(w)` is unit-dependent.
- The formula was fit on near-failure sets. For sets with RIR above 0, use `r + rir` as the rep count, or flag the estimate as lower confidence.
- Guard against loads below ~1.8 kg, where the denominator goes non-positive.

**Caveats:** Preprint by a Fitbod employee, optimized on Fitbod data. Validated by internal consistency, not against measured 1RMs. Best available cross-exercise formula, but cite as a preprint.

---

### reynolds2006

**Citation:** Reynolds et al. 2006. **Full citation not yet located.**

**Access:** Not read. Known only secondhand.

**Finding (as reported by vbt_free_weight_inaccurate):** Repetitions-performed 1RM equations predicted more accurately on the chest press and leg press from a 5RM load than from 10RM or 20RM loads, indicating these equations are only accurate with fatiguing loads close to a 1RM.

**Rule for IRON:** Down-weight or flag `estimated_1rm` from sets above 12 reps in trend views. Never present a 1RM computed from a 15+ rep set as the user's max.

**Caveats:** This is the actual source of the high-rep accuracy rule, but it has only been read through another paper's citation of it. Locate and read the primary source before treating `ONE_RM_MAX_RELIABLE_REPS` as properly cited. The rule itself is sound and consistent with marzagao2026 being fit on near-failure sets, so it can stay in the engine meanwhile, but the citation is incomplete.

---

### one_rm_exercise_dependent

**Citation:** Validity of predictive equations for one repetition maximum across exercises. https://research.usc.edu.au/esploro/outputs/journalArticle/Validade-das-equações-preditivas-de-uma/99448976802621

**Access:** Abstract

**Finding:** Different classical equations performed best on different exercises; 1RM prediction validity is exercise-dependent.

**Rule for IRON:** Supports using a weight-dependent formula (marzagao2026) over any single classical formula. Per-machine tracking already segments by exercise, which is the axis this varies along.

**Caveats:** **INCOMPLETE AND UNVERIFIED.** Authors, year, and journal still need to be filled in from the source page. Built from an abstract only. Given that the neighbouring entry in this section turned out to be mis-attributed, verify this finding is the paper's own result before relying on it.

---

## Athletic and power training (background only)

### vbt_free_weight_inaccurate

**Citation:** Accuracy of Predicting One-Repetition Maximum from Submaximal Velocity in the Barbell Back Squat and Bench Press. *Journal of Human Kinetics*. https://jhk.termedia.pl/Accuracy-of-Predicting-One-Repetition-Maximum-from-Submaximal-Velocity-in-the-Barbell,158707,0,2.html

**Access:** Full text

**Finding:** Seventeen well-trained men performed squat and bench press 1RM tests with average concentric velocity recorded on every warm-up and attempt. Both 2-point and 4-point submaximal velocity regression forecasts differed significantly from the actual 1RM. The squat was overpredicted by 18.5% (2-point) and 23.8% (4-point); the bench press was off by 8.2% and 6.3%. Bland-Altman and mountain plots showed poor agreement with wide limits. The authors advise against using submaximal velocity to predict 1RM in free-weight barbell movements.

An important methodological detail: participants were deliberately given no maximal-intended-velocity cue, to increase ecological validity. The authors argue this explains the disagreement with earlier studies that found velocity prediction accurate, since those provided the cue. Prediction has also been more accurate on machine-based movements than free weights in other work.

**Rule for IRON:** None. This is a reason not to pursue velocity-based features even if hardware were available, and a counterweight to the more positive VBT reviews below.

**Caveats:** Author list not yet captured; fill in from the abstract page or PDF. Squat and bench only, well-trained young men only.

**Correction note:** An earlier draft of this document keyed this paper as `one_rm_high_rep_accuracy` and cited it as the basis for down-weighting high-rep 1RM estimates. That was wrong. The 5RM-versus-10RM finding belongs to Reynolds et al. (2006), which this paper cites in its introduction. See the `reynolds2006` entry above.

---

### wlodarczyk2021

**Citation:** Włodarczyk M, Adamczewski P, Bogumił B, Kuźniar M. Effects of Velocity-Based Training on Strength and Power in Elite Athletes: A Systematic Review. *International Journal of Environmental Research and Public Health*. 2021;18(10):5257. https://doi.org/10.3390/ijerph18105257

Free full text: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8156188/

**Access:** Abstract

**Finding:** Velocity loss thresholds of 10-20% within a set help induce neuromuscular adaptations while limiting fatigue in elite athletes.

**Rule for IRON:** None directly. VBT requires a bar-speed sensor. The transferable idea for an athletic goal is: stop sets well short of failure (3-4 RIR), use heavier loads, allow longer recovery.

---

### zhang2022

**Citation:** Zhang M, Tan Q, Sun J, et al. Comparison of Velocity and Percentage-based Training on Maximal Strength: Meta-analysis. *International Journal of Environmental Research and Public Health*. 2022. https://pmc.ncbi.nlm.nih.gov/articles/PMC9368129

**Access:** Abstract

**Finding:** Meta-analysis of VBT effects on lower-body strength, jump, and sprint in trained individuals.

**Rule for IRON:** Background only. Same limitation as wlodarczyk2021.

---

## Rules summary

Quick reference for what the engine does and why. Constants live in `api/app/services/constants.py`.

| Rule | Value | Basis |
|---|---|---|
| Count indirect sets as | 0.5 | pelland2026 |
| Hypertrophy RIR target | 0-2 | robinson2024 |
| Strength RIR target | 1-4 | robinson2024 |
| Novice RIR target | 2-3 | judgment call, see note |
| Strength load floor | 80% est. 1RM | currier2023 |
| Min frequency per muscle | 2x/week | schoenfeld2016 |
| Recovery after failure sets | 48h | moran_navarro2017, pareja_blanco2020 |
| Failure sets to trigger recovery rule | 2 | moran_navarro2017 |
| Recovery rule granularity | per muscle group | belcher2019 |
| 1RM formula | weight-dependent, kg | marzagao2026 |
| 1RM reliable rep ceiling | 12 | reynolds2006 (citation incomplete) |
| Hypertrophy volume cap | none | pelland2026 |
| Strength volume behavior | plateau | pelland2026 |
| Per-session set cap | TBD | remmert2025 (unread) |

**Note on judgment calls:** the novice RIR target and the "general" goal target are not findings. They are our decisions, informed by the evidence that RIR estimation is least reliable in untrained lifters and that failure training carries the highest injury and recovery cost. They should be labeled as project decisions in any write-up, not presented as research conclusions.

## Open items

- Read pelland2026 Table 4 for the numeric strength volume plateau
- Read remmert2025 full text for the per-session set cap
- obtain full text for exact R² by rep range if finer-grained thresholds are wanted
- Complete the citation for one_rm_exercise_dependent and verify its finding is its own
- Capture the author list for vbt_free_weight_inaccurate
- Get robinson2024 full text through RPI library access
- Read zourdos2016 and lopez2021 in full
- Decide the "general" goal RIR target (currently 1-3)