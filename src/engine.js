import { MATERIALS_DB, MAP_DATA, SHELF_LIFE_BASE, MATERIAL_SHELF_MULTIPLIER, SUSTAINABILITY_SCORES } from './data.js';

/* ============================================
   PackSmart AI — Recommendation Engine
   Multi-Parameter Optimization AI Core
   ============================================ */

export class PackagingRecommendationEngine {
    constructor() {
        this.weights = {
            moistureBarrier: 0.20,
            oxygenBarrier: 0.20,
            lightBarrier: 0.10,
            aromaBarrier: 0.08,
            temperature: 0.10,
            mechanicalStrength: 0.08,
            sealability: 0.06,
            cost: 0.08,
            sustainability: 0.10
        };
    }

    recommend(input) {
        const {
            category, commodity, commodityData,
            moisture, fat, ph, aw, respiration,
            sensitivity, productForm, weight,
            storageType, storageTemp, relativeHumidity,
            desiredShelfLife, transportCondition,
            priority, preferences
        } = input;

        const barrierReqs = this.calculateBarrierRequirements(input);
        const scoredMaterials = this.scoreMaterials(barrierReqs, input);
        const topMaterials = scoredMaterials.slice(0, 3);
        const recommendations = topMaterials.map((mat, idx) => 
            this.buildRecommendation(mat, input, idx)
        );
        const shelfLifeAnalysis = this.analyzeShelfLife(recommendations, input);
        const mapRecommendation = this.getMapRecommendation(input);
        const sustainabilityAnalysis = this.analyzeSustainability(recommendations);
        const ecoAlternatives = preferences.eco ? this.getEcoAlternatives(barrierReqs, input) : null;

        return {
            commodity: commodity,
            category: category,
            barrierRequirements: barrierReqs,
            recommendations,
            shelfLifeAnalysis,
            mapRecommendation,
            sustainabilityAnalysis,
            ecoAlternatives,
            specsTable: this.buildSpecsTable(recommendations, input),
            complianceNotes: preferences.regulatory ? this.getComplianceNotes(input) : null
        };
    }

    calculateBarrierRequirements(input) {
        const { moisture, fat, ph, aw, respiration, sensitivity, storageType, desiredShelfLife, productForm } = input;

        let moistureBarrier = 1;
        let oxygenBarrier = 1;
        let lightBarrier = 1;
        let aromaBarrier = 1;
        let tempResistance = "standard";
        let mechanicalNeed = "moderate";

        if (sensitivity === "moisture-gain") moistureBarrier = 5;
        else if (sensitivity === "moisture-loss") moistureBarrier = 4;
        else if (moisture > 80) moistureBarrier = 3;
        else if (moisture < 15) moistureBarrier = 5;
        else moistureBarrier = 3;

        if (sensitivity === "oxidation") oxygenBarrier = 5;
        else if (fat > 20) oxygenBarrier = 4;
        else if (sensitivity === "microbial" && aw > 0.90) oxygenBarrier = 3;
        else if (respiration > 0) oxygenBarrier = respiration > 20 ? 1 : 2;
        else oxygenBarrier = 2;

        if (sensitivity === "light") lightBarrier = 5;
        else if (fat > 10 && sensitivity === "oxidation") lightBarrier = 4;
        else if (sensitivity === "aroma-loss") lightBarrier = 3;
        else lightBarrier = 1;

        if (sensitivity === "aroma-loss") aromaBarrier = 5;
        else if (["spices", "beverages"].includes(input.category)) aromaBarrier = 4;
        else aromaBarrier = 1;

        if (storageType === "frozen") tempResistance = "frozen";
        else if (storageType === "chilled") tempResistance = "chilled";
        else tempResistance = "ambient";

        if (input.transportCondition === "export" || productForm === "liquid" || input.weight > 1000) {
            mechanicalNeed = "high";
        }

        const shelfLifeFactor = desiredShelfLife > 90 ? 1.3 : desiredShelfLife > 30 ? 1.15 : 1.0;
        
        moistureBarrier = Math.min(5, Math.round(moistureBarrier * shelfLifeFactor));
        oxygenBarrier = Math.min(5, Math.round(oxygenBarrier * shelfLifeFactor));

        return {
            moistureBarrier,
            oxygenBarrier,
            lightBarrier,
            aromaBarrier,
            tempResistance,
            mechanicalNeed,
            needsBreathability: respiration > 10,
            needsHighRespiration: respiration > 25,
            isPerishable: aw > 0.90 && moisture > 60,
            isLowMoisture: moisture < 15,
            isHighFat: fat > 20,
            isAcidic: ph < 4.5
        };
    }

    scoreMaterials(reqs, input) {
        const { priority, productForm, respiration, storageType } = input;
        let weights = { ...this.weights };

        if (priority === "cost") {
            weights.cost = 0.25;
            weights.sustainability = 0.05;
        } else if (priority === "sustainability") {
            weights.sustainability = 0.25;
            weights.cost = 0.05;
        } else if (priority === "shelf-life") {
            weights.moistureBarrier = 0.25;
            weights.oxygenBarrier = 0.25;
        }

        let candidates = MATERIALS_DB.filter(mat => {
            if (productForm === "liquid" && !["glass", "tin-can", "pet", "al-laminate"].includes(mat.id)) {
                if (!mat.id.includes("laminate") && mat.id !== "pet-pe" && mat.id !== "vacuum-pouch") return false;
            }
            if (reqs.needsBreathability && mat.barrierRating.oxygen >= 4 && !["micro-perf", "breathable", "ldpe"].includes(mat.id)) {
                return false;
            }
            if (storageType === "frozen" && mat.tempRange.min > -15) {
                return false;
            }
            return true;
        });

        const scored = candidates.map(mat => {
            let score = 0;
            score += this.matchScore(mat.barrierRating.moisture, reqs.moistureBarrier) * weights.moistureBarrier;

            if (reqs.needsBreathability) {
                score += (1 - mat.barrierRating.oxygen / 5) * 0.5 * weights.oxygenBarrier;
                if (mat.barrierRating.oxygen === 0) score += 0.3 * weights.oxygenBarrier;
                else score += 0.5 * weights.oxygenBarrier;
            } else {
                score += this.matchScore(mat.barrierRating.oxygen, reqs.oxygenBarrier) * weights.oxygenBarrier;
            }

            score += this.matchScore(mat.barrierRating.light, reqs.lightBarrier) * weights.lightBarrier;
            score += this.matchScore(mat.barrierRating.aroma, reqs.aromaBarrier) * weights.aromaBarrier;

            let tempScore = (storageType === "frozen" && mat.tempRange.min <= -18) || (storageType === "chilled" && mat.tempRange.min <= 0) || (storageType === "ambient") ? 1 : 0.3;
            score += tempScore * weights.temperature;

            let mechScore = reqs.mechanicalNeed === "high" ? (mat.mechanicalStrength === "Excellent" ? 1 : mat.mechanicalStrength === "Good" ? 0.7 : 0.3) : 0.8;
            score += mechScore * weights.mechanicalStrength;

            let sealScore = mat.sealability.includes("Excellent") ? 1 : mat.sealability.includes("Good") ? 0.8 : 0.5;
            score += sealScore * weights.sealability;

            score += (1 - (mat.costIndex / 5)) * weights.cost;

            const susScores = SUSTAINABILITY_SCORES[mat.id];
            score += (susScores ? susScores.overall / 100 : 0.3) * weights.sustainability;

            return { material: mat, score, matchPercent: Math.round(score * 100) };
        });

        return scored.sort((a, b) => b.score - a.score);
    }

    matchScore(materialRating, requirement) {
        if (requirement === 0) return 0.8;
        const diff = Math.abs(materialRating - requirement);
        if (diff === 0) return 1.0;
        if (diff === 1) return 0.8;
        if (diff === 2) return 0.5;
        if (diff === 3) return 0.2;
        return 0.05;
    }

    buildRecommendation(scoredItem, input, rank) {
        const mat = scoredItem.material;
        const { sensitivity, respiration, category } = input;

        return {
            rank: rank + 1,
            material: mat,
            score: scoredItem.score,
            matchPercent: scoredItem.matchPercent,
            specifications: {
                otr: this.recommendOTR(mat, input),
                wvtr: this.recommendWVTR(mat, input),
                thickness: this.recommendThickness(mat, input),
                sealability: mat.sealability,
                gasPermeability: mat.gasPermeability,
                mechanicalStrength: mat.mechanicalStrength,
                tempRange: `${mat.tempRange.min}°C to ${mat.tempRange.max}°C`,
                mapSuitable: (respiration > 0 || sensitivity === "microbial" || ["meat", "seafood", "dairy"].includes(category)) ? "Yes" : "Not Required"
            },
            tags: this.generateTags(mat, input)
        };
    }

    recommendThickness(mat, input) {
        let base = (mat.thickness.min + mat.thickness.max) / 2;
        if (input.weight > 1000) base *= 1.3;
        else if (input.weight > 500) base *= 1.15;
        if (input.transportCondition === "export") base *= 1.2;
        else if (input.transportCondition === "domestic") base *= 1.1;
        if (input.desiredShelfLife > 90) base *= 1.15;
        base = Math.round(base);
        return {
            value: `${Math.max(mat.thickness.min, base - 10)}–${Math.min(mat.thickness.max, base + 10)} ${mat.thickness.unit}`,
            recommended: base + " " + mat.thickness.unit
        };
    }

    recommendOTR(mat, input) {
        if (input.respiration > 20) return { value: `${mat.otr.min.toLocaleString()}–${mat.otr.max.toLocaleString()} ${mat.otr.unit}`, note: "High OTR needed for active respiration" };
        if (input.sensitivity === "oxidation") return { value: `< ${Math.max(1, mat.otr.min)} ${mat.otr.unit}`, note: "Minimal O₂ transmission to prevent oxidation" };
        return { value: `${mat.otr.min.toLocaleString()}–${mat.otr.max.toLocaleString()} ${mat.otr.unit}`, note: "" };
    }

    recommendWVTR(mat, input) {
        if (input.sensitivity === "moisture-gain") return { value: `< ${Math.max(0.5, mat.wvtr.min)} ${mat.wvtr.unit}`, note: "Ultra-low WVTR to prevent moisture absorption" };
        if (input.sensitivity === "moisture-loss") return { value: `< ${Math.max(5, mat.wvtr.min + 3)} ${mat.wvtr.unit}`, note: "Low WVTR to prevent dehydration" };
        return { value: `${mat.wvtr.min}–${mat.wvtr.max} ${mat.wvtr.unit}`, note: "" };
    }

    generateTags(mat, input) {
        const tags = [];
        if (mat.sustainability.biodegradable) tags.push({ text: "Biodegradable", eco: true });
        if (mat.sustainability.recyclable) tags.push({ text: `Recyclable (#${mat.sustainability.recycleCode})`, eco: true });
        if (mat.sealability.includes("Excellent")) tags.push({ text: "Excellent Seal" });
        if (mat.barrierRating.oxygen >= 4) tags.push({ text: "High O₂ Barrier" });
        if (mat.barrierRating.moisture >= 4) tags.push({ text: "High Moisture Barrier" });
        if (mat.barrierRating.light >= 4) tags.push({ text: "Light Protection" });
        if (mat.id.includes("micro-perf") || mat.id.includes("breathable")) tags.push({ text: "Breathable" });
        if (input.storageType === "frozen" && mat.tempRange.min <= -18) tags.push({ text: "Freezer Safe" });
        if (mat.costIndex <= 1.2) tags.push({ text: "Cost Effective" });
        if (mat.clarity === "Excellent") tags.push({ text: "Transparent" });
        return tags;
    }

    analyzeShelfLife(recommendations, input) {
        const category = input.category;
        const storage = input.storageType || "ambient";
        const baseLife = SHELF_LIFE_BASE[category]?.[storage] || 7;
        
        return {
            unpackaged: Math.round(baseLife * 0.5),
            standard: baseLife,
            recommendations: recommendations.map(rec => {
                const multiplier = MATERIAL_SHELF_MULTIPLIER[rec.material.id] || 1.5;
                const extended = Math.round(baseLife * multiplier);
                return {
                    material: rec.material.name,
                    days: Math.min(extended, input.desiredShelfLife ? Math.max(extended, input.desiredShelfLife) : extended),
                    extension: Math.round((multiplier - 1) * 100)
                };
            })
        };
    }

    getMapRecommendation(input) {
        const { category, respiration, commodityData } = input;
        if (!["fruits", "vegetables", "meat", "seafood", "dairy", "bakery"].includes(category)) return null;

        let gasComp, notes = [];
        if (category === "fruits") {
            const isClimacteric = commodityData?.climacteric;
            gasComp = isClimacteric ? MAP_DATA.fruits.climacteric : MAP_DATA.fruits.nonClimacteric;
            notes.push(isClimacteric ? "Climacteric fruit — ethylene management recommended." : "Non-climacteric fruit — maintain optimal gas composition.");
        } else if (category === "vegetables") {
            gasComp = respiration > 20 ? MAP_DATA.vegetables.high_respiration : MAP_DATA.vegetables.low_respiration;
            notes.push(respiration > 20 ? "High respiration rate — breathable packaging essential." : "Moderate respiration — standard MAP suitable.");
        } else if (category === "meat") {
            gasComp = MAP_DATA.meat;
            notes.push("Anaerobic or low-O₂ atmosphere to inhibit spoilage and oxidation.");
        } else if (category === "seafood") {
            gasComp = MAP_DATA.seafood;
            notes.push("High CO₂ atmosphere essential for seafood to inhibit microbial growth.");
        } else if (category === "bakery") {
            gasComp = MAP_DATA.bakery;
            notes.push("CO₂/N₂ atmosphere to inhibit mold growth.");
        } else if (category === "dairy") {
            gasComp = MAP_DATA.dairy_cheese;
            notes.push("Low oxygen atmosphere to prevent oxidation and mold growth.");
        }

        if (!gasComp) return null;
        const o2Mid = (gasComp.o2.min + gasComp.o2.max) / 2;
        const co2Mid = (gasComp.co2.min + gasComp.co2.max) / 2;
        const n2 = 100 - o2Mid - co2Mid;

        return {
            applicable: true,
            gasComposition: {
                o2: { min: gasComp.o2.min, max: gasComp.o2.max, recommended: o2Mid },
                co2: { min: gasComp.co2.min, max: gasComp.co2.max, recommended: co2Mid },
                n2: { recommended: Math.max(0, n2) }
            },
            notes
        };
    }

    analyzeSustainability(recommendations) {
        return recommendations.map(rec => {
            const scores = SUSTAINABILITY_SCORES[rec.material.id];
            return {
                material: rec.material.name,
                recyclability: scores?.recyclability || 0,
                biodegradability: scores?.biodegradability || 0,
                carbonFootprint: 100 - (scores?.carbonFootprint || 50),
                overall: scores?.overall || 30
            };
        });
    }

    getEcoAlternatives(reqs, input) {
        const ecoMaterials = MATERIALS_DB.filter(mat => 
            mat.sustainability.biodegradable || 
            (mat.sustainability.recyclable && SUSTAINABILITY_SCORES[mat.id]?.overall > 50)
        );

        const scored = ecoMaterials.map(mat => {
            let score = (this.matchScore(mat.barrierRating.moisture, reqs.moistureBarrier) * 0.35) + 
                        (this.matchScore(mat.barrierRating.oxygen, reqs.oxygenBarrier) * 0.25) + 
                        ((SUSTAINABILITY_SCORES[mat.id]?.overall || 0) / 100 * 0.40);
            return { material: mat, score, matchPercent: Math.round(score * 100) };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, 2).map((s, idx) => ({
            rank: idx + 1,
            material: s.material,
            matchPercent: s.matchPercent,
            sustainabilityScore: SUSTAINABILITY_SCORES[s.material.id]?.overall || 0,
            note: s.material.sustainability.biodegradable ? "Compostable/biodegradable option" : "Recyclable option"
        }));
    }

    buildSpecsTable(recommendations, input) {
        return {
            headers: ["Parameter", ...recommendations.map(r => r.material.name)],
            rows: [
                { param: "OTR", values: recommendations.map(r => r.specifications.otr.value) },
                { param: "WVTR", values: recommendations.map(r => r.specifications.wvtr.value) },
                { param: "Film Thickness", values: recommendations.map(r => r.specifications.thickness.recommended) },
                { param: "Sealability", values: recommendations.map(r => r.specifications.sealability) },
                { param: "Gas Permeability", values: recommendations.map(r => r.specifications.gasPermeability) },
                { param: "Mechanical Strength", values: recommendations.map(r => r.specifications.mechanicalStrength) },
                { param: "Temperature Range", values: recommendations.map(r => r.specifications.tempRange) },
                { param: "MAP Suitability", values: recommendations.map(r => r.specifications.mapSuitable) },
                { param: "Relative Cost", values: recommendations.map(r => "$".repeat(Math.ceil(r.material.costIndex))) },
                { param: "Recyclable", values: recommendations.map(r => r.material.sustainability.recyclable ? "Yes" : "No") },
                { param: "Biodegradable", values: recommendations.map(r => r.material.sustainability.biodegradable ? "Yes" : "No") }
            ]
        };
    }

    getComplianceNotes(input) {
        const notes = [
            { title: "FDA Compliance", note: "Materials are FDA-approved for food contact." },
            { title: "EU Regulation", note: "Complies with EU Framework Regulation (EC) No 1935/2004." }
        ];
        if (input.category === "meat" || input.category === "seafood") notes.push({ title: "HACCP", note: "Integrate packaging into HACCP plan." });
        if (input.transportCondition === "export") notes.push({ title: "Export Requirements", note: "Check destination country regulations." });
        notes.push({ title: "Labeling Requirements", note: "Include recycling codes, storage instructions, 'Best Before' date." });
        return notes;
    }
}

export const engine = new PackagingRecommendationEngine();
