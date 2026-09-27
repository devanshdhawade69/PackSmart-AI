import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/reui/badge";
import { CheckIcon, LoaderCircleIcon, Package, Layers, Droplets, Thermometer, Shield, Leaf, ArrowRight, ArrowLeft } from "lucide-react";
import { Stepper, StepperContent, StepperDescription, StepperIndicator, StepperItem, StepperNav, StepperPanel, StepperSeparator, StepperTitle, StepperTrigger } from "@/components/reui/stepper";

import { engine } from './engine';
import { COMMODITIES_DB, MATERIALS_DB } from './data';

export default function App() {
  const [activeTab, setActiveTab] = useState("wizard");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      <div className="relative overflow-hidden border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 opacity-50"></div>
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">PackSmart AI</h1>
                <p className="text-slate-400 font-medium mt-1">Intelligent Packaging Optimization Engine</p>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[300px]">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-slate-700/50">
                <TabsTrigger value="wizard" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">Wizard</TabsTrigger>
                <TabsTrigger value="database" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Database</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 md:px-8 py-16">
        {activeTab === "wizard" ? <Wizard /> : <MaterialDatabase />}
      </main>
    </div>
  );
}

function Wizard() {
  const [step, setStep] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    category: "fruits",
    commodity: "Apple",
    productForm: "whole",
    priority: "balanced",
    moisture: 85,
    fat: 0.2,
    ph: 3.5,
    aw: 0.98,
    respiration: 6,
    sensitivity: "respiration",
    weight: 1000,
    storageType: "chilled",
    storageTemp: 4,
    relativeHumidity: 85,
    desiredShelfLife: 14,
    transportCondition: "domestic",
    preferences: { eco: true, regulatory: true }
  });

  const handleNext = () => {
    if (step === 3) {
      calculateResults();
    } else {
      setStep(s => s + 1);
    }
  };

  const calculateResults = () => {
    setIsCalculating(true);
    setStep(4);
    setTimeout(() => {
      const recommendations = engine.recommend({
        ...formData,
        commodityData: COMMODITIES_DB[formData.category].items.find(i => i.name === formData.commodity)
      });
      setResults(recommendations);
      setIsCalculating(false);
    }, 1500); // Fake delay for UX
  };

  const steps = [
    { title: "Product", description: "Basic Information" },
    { title: "Parameters", description: "Characteristics" },
    { title: "Storage", description: "Logistics details" },
    { title: "Results", description: "AI Recommendations" }
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <Stepper
        value={step}
        onValueChange={setStep}
        indicators={{
          completed: <CheckIcon className="size-3.5" />,
          loading: <LoaderCircleIcon className="size-3.5 animate-spin" />,
        }}
        className="w-full space-y-8"
      >
        <StepperNav>
          {steps.map((s, index) => (
            <StepperItem key={index} step={index + 1} className="relative">
              <StepperTrigger className="flex justify-start gap-3 rounded-lg p-2 transition-colors hover:bg-slate-800/50">
                <StepperIndicator className="bg-slate-800 border-slate-700 text-slate-300 data-[state=active]:bg-indigo-500 data-[state=active]:border-indigo-500 data-[state=active]:text-white data-[state=completed]:bg-emerald-500 data-[state=completed]:border-emerald-500">
                  {index + 1}
                </StepperIndicator>
                <div className="flex flex-col items-start gap-0.5">
                  <StepperTitle className="text-slate-200">{s.title}</StepperTitle>
                  <StepperDescription className="text-slate-500">{s.description}</StepperDescription>
                </div>
              </StepperTrigger>
              {steps.length > index + 1 && (
                <StepperSeparator className="md:mx-2.5 bg-slate-800 data-[state=completed]:bg-emerald-500" />
              )}
            </StepperItem>
          ))}
        </StepperNav>

        <StepperPanel className="mt-8">
          <StepperContent value={1}>
            <Step1Product data={formData} update={(d) => setFormData({...formData, ...d})} />
          </StepperContent>
          <StepperContent value={2}>
            <Step2Params data={formData} update={(d) => setFormData({...formData, ...d})} />
          </StepperContent>
          <StepperContent value={3}>
            <Step3Storage data={formData} update={(d) => setFormData({...formData, ...d})} />
          </StepperContent>
          <StepperContent value={4}>
            {isCalculating ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-xl bg-indigo-500/30 animate-pulse"></div>
                  <LoaderCircleIcon className="w-16 h-16 text-indigo-400 animate-spin relative z-10" />
                </div>
                <h3 className="text-xl font-medium text-slate-200">Analyzing thousands of material combinations...</h3>
                <p className="text-slate-400">Running multi-parameter optimization matrix</p>
              </div>
            ) : results ? (
              <Step4Results results={results} reset={() => setStep(1)} />
            ) : null}
          </StepperContent>
        </StepperPanel>

        {step < 4 && (
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-800/60">
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-slate-300"
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
              onClick={handleNext}
            >
              {step === 3 ? "Generate Recommendations" : "Continue"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </Stepper>
    </div>
  );
}

function Step1Product({ data, update }) {
  const handleCategoryChange = (val) => {
    const firstItem = COMMODITIES_DB[val].items[0];
    update({
      category: val,
      commodity: firstItem.name,
      moisture: firstItem.moisture,
      fat: firstItem.fat,
      ph: firstItem.ph,
      aw: firstItem.aw,
      respiration: firstItem.respiration,
      sensitivity: firstItem.sensitivity,
      productForm: firstItem.form
    });
  };

  const handleCommodityChange = (val) => {
    const item = COMMODITIES_DB[data.category].items.find(i => i.name === val);
    update({
      commodity: val,
      moisture: item.moisture,
      fat: item.fat,
      ph: item.ph,
      aw: item.aw,
      respiration: item.respiration,
      sensitivity: item.sensitivity,
      productForm: item.form
    });
  };

  return (
    <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-slate-800/60 pb-6">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6 text-indigo-400" /> Product Profile
        </CardTitle>
        <CardDescription className="text-slate-400 text-base">Select your product category and specific commodity.</CardDescription>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-slate-300 text-sm font-semibold">Category</Label>
            <Select value={data.category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-200 h-12">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                {Object.entries(COMMODITIES_DB).map(([key, cat]) => (
                  <SelectItem key={key} value={key} className="focus:bg-slate-800 focus:text-white cursor-pointer">{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label className="text-slate-300 text-sm font-semibold">Specific Commodity</Label>
            <Select value={data.commodity} onValueChange={handleCommodityChange}>
              <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-200 h-12">
                <SelectValue placeholder="Select Commodity" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 max-h-[300px]">
                {COMMODITIES_DB[data.category].items.map((item) => (
                  <SelectItem key={item.name} value={item.name} className="focus:bg-slate-800 focus:text-white cursor-pointer">{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-800/60">
          <Label className="text-slate-300 text-sm font-semibold block">Optimization Priority</Label>
          <RadioGroup 
            value={data.priority} 
            onValueChange={(val) => update({ priority: val })}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[
              { id: "balanced", label: "Balanced", desc: "Optimal mix of performance and cost" },
              { id: "shelf-life", label: "Max Shelf-Life", desc: "Prioritize maximum barrier properties" },
              { id: "sustainability", label: "Eco-Friendly", desc: "Prioritize recyclable/compostable" },
              { id: "cost", label: "Cost Effective", desc: "Prioritize economic materials" }
            ].map(opt => (
              <Label 
                key={opt.id} 
                className={`flex flex-col p-5 rounded-xl border cursor-pointer transition-all ${data.priority === opt.id ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <RadioGroupItem value={opt.id} id={opt.id} className="text-indigo-500 border-slate-600" />
                  <span className={`font-semibold ${data.priority === opt.id ? 'text-indigo-400' : 'text-slate-200'}`}>{opt.label}</span>
                </div>
                <span className="text-sm text-slate-400 ml-8">{opt.desc}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}

function Step2Params({ data, update }) {
  const SliderControl = ({ label, prop, min, max, step, unit }) => (
    <div className="space-y-5 bg-slate-950/30 p-6 rounded-xl border border-slate-800/40">
      <div className="flex justify-between items-center">
        <Label className="text-slate-300 font-medium">{label}</Label>
        <span className="text-indigo-400 font-mono bg-indigo-500/10 px-3 py-1.5 rounded-md text-sm">{data[prop]} {unit}</span>
      </div>
      <Slider 
        min={min} max={max} step={step} 
        value={[data[prop]]} 
        onValueChange={([val]) => update({ [prop]: val })} 
        className="py-2"
      />
    </div>
  );

  return (
    <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-slate-800/60 pb-6">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Droplets className="w-6 h-6 text-emerald-400" /> Physico-Chemical Parameters
        </CardTitle>
        <CardDescription className="text-slate-400 text-base">These values were auto-filled based on <b>{data.commodity}</b>, but you can override them.</CardDescription>
      </CardHeader>
      <CardContent className="pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SliderControl label="Moisture Content" prop="moisture" min={0} max={100} step={1} unit="%" />
          <SliderControl label="Fat Content" prop="fat" min={0} max={100} step={0.1} unit="%" />
          <SliderControl label="Water Activity (aw)" prop="aw" min={0} max={1} step={0.01} unit="" />
          <SliderControl label="pH Level" prop="ph" min={0} max={14} step={0.1} unit="" />
          
          <div className="space-y-4 bg-slate-950/30 p-6 rounded-xl border border-slate-800/40">
            <Label className="text-slate-300 font-medium">Primary Degradation Factor</Label>
            <Select value={data.sensitivity} onValueChange={(val) => update({ sensitivity: val })}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                <SelectItem value="microbial">Microbial Spoilage</SelectItem>
                <SelectItem value="oxidation">Oxidation / Rancidity</SelectItem>
                <SelectItem value="moisture-loss">Moisture Loss (Dehydration)</SelectItem>
                <SelectItem value="moisture-gain">Moisture Gain (Sogginess)</SelectItem>
                <SelectItem value="respiration">High Respiration</SelectItem>
                <SelectItem value="aroma-loss">Aroma/Flavor Loss</SelectItem>
                <SelectItem value="light">Light Sensitivity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4 bg-slate-950/30 p-6 rounded-xl border border-slate-800/40">
            <Label className="text-slate-300 font-medium">Product Form</Label>
            <Select value={data.productForm} onValueChange={(val) => update({ productForm: val })}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                <SelectItem value="whole">Whole / Solid</SelectItem>
                <SelectItem value="granular">Granular / Particulate</SelectItem>
                <SelectItem value="powder">Powder</SelectItem>
                <SelectItem value="liquid">Liquid</SelectItem>
                <SelectItem value="semi-solid">Semi-Solid / Paste</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Step3Storage({ data, update }) {
  return (
    <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-slate-800/60 pb-6">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Thermometer className="w-6 h-6 text-amber-400" /> Storage & Logistics
        </CardTitle>
        <CardDescription className="text-slate-400 text-base">Define supply chain conditions and shelf-life goals.</CardDescription>
      </CardHeader>
      <CardContent className="pt-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <Label className="text-slate-300 font-medium">Target Net Weight (grams)</Label>
            <Input 
              type="number" 
              value={data.weight} 
              onChange={(e) => update({ weight: Number(e.target.value) })}
              className="bg-slate-950/50 border-slate-700 text-slate-200 h-12 px-4"
            />
          </div>
          
          <div className="space-y-4">
            <Label className="text-slate-300 font-medium">Desired Shelf-Life (Days)</Label>
            <Input 
              type="number" 
              value={data.desiredShelfLife} 
              onChange={(e) => update({ desiredShelfLife: Number(e.target.value) })}
              className="bg-slate-950/50 border-slate-700 text-slate-200 h-12 px-4 focus-visible:ring-amber-500"
            />
          </div>
          
          <div className="space-y-4">
            <Label className="text-slate-300 font-medium">Storage Temperature Regime</Label>
            <Select value={data.storageType} onValueChange={(val) => update({ storageType: val })}>
              <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-200 h-12 px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                <SelectItem value="ambient">Ambient (15-25°C)</SelectItem>
                <SelectItem value="chilled">Chilled/Refrigerated (0-4°C)</SelectItem>
                <SelectItem value="frozen">Frozen (≤ -18°C)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4">
            <Label className="text-slate-300 font-medium">Transportation Route</Label>
            <Select value={data.transportCondition} onValueChange={(val) => update({ transportCondition: val })}>
              <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-200 h-12 px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                <SelectItem value="local">Local Delivery (Low Stress)</SelectItem>
                <SelectItem value="domestic">Domestic Highway (Medium Stress)</SelectItem>
                <SelectItem value="export">Export / Ocean Freight (High Stress)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Step4Results({ results, reset }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-emerald-400" />
            AI Optimized Packaging
          </h2>
          <p className="text-slate-400 mt-1 text-lg">Top recommendations for {results.commodity} ({results.category})</p>
        </div>
        <Button onClick={reset} variant="outline" className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700">Start New Analysis</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {results.recommendations.map((rec, i) => (
          <Card key={i} className={`relative overflow-hidden bg-slate-900 border-slate-800 transition-all hover:scale-[1.02] ${i === 0 ? 'ring-2 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'shadow-lg'}`}>
            {i === 0 && <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">TOP MATCH</div>}
            {i === 0 && <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>}
            
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-white">{rec.material.name}</CardTitle>
              <CardDescription className="text-slate-400">{rec.material.fullName}</CardDescription>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${i===0 ? 'bg-indigo-500' : 'bg-slate-500'}`} style={{width: `${rec.matchPercent}%`}}></div>
                </div>
                <span className="text-sm font-bold text-slate-300">{rec.matchPercent}%</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {rec.tags.map((tag, j) => (
                  <Badge key={j} variant="outline" className={`bg-slate-950 border-slate-700 ${tag.eco ? 'text-emerald-400 border-emerald-900 bg-emerald-950/30' : 'text-slate-300'}`}>
                    {tag.eco && <Leaf className="w-3 h-3 mr-1 inline" />} {tag.text}
                  </Badge>
                ))}
              </div>
              <div className="bg-slate-950/50 rounded-xl p-5 space-y-3 border border-slate-800/50">
                <div className="flex justify-between items-center text-sm"><span className="text-slate-400">Thickness</span><span className="text-slate-200 font-mono">{rec.specifications.thickness.recommended}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-slate-400">Est. Shelf Life</span><span className="text-emerald-400 font-bold">{results.shelfLifeAnalysis.recommendations[i].days} Days</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-slate-400">Cost Profile</span><span className="text-slate-200 tracking-widest font-medium">{"$".repeat(Math.ceil(rec.material.costIndex))}</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-slate-800/60 bg-slate-900/80">
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" /> Technical Specifications Comparison
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-950/50">
              <TableRow className="border-slate-800 hover:bg-transparent">
                {results.specsTable.headers.map((h, i) => (
                  <TableHead key={i} className={`text-slate-300 font-semibold ${i===0?'w-1/4':''}`}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.specsTable.rows.map((row, i) => (
                <TableRow key={i} className="border-slate-800/50 hover:bg-slate-800/30">
                  <TableCell className="font-medium text-slate-400">{row.param}</TableCell>
                  {row.values.map((v, j) => (
                    <TableCell key={j} className="text-slate-200">{v}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function MaterialDatabase() {
  return (
    <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm min-h-[600px]">
      <CardHeader className="border-b border-slate-800/60 pb-6 mb-4">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Layers className="w-6 h-6 text-indigo-400" /> Material Database
        </CardTitle>
        <CardDescription className="text-slate-400 text-base">Comprehensive catalog of packaging materials and their properties.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto p-6 pt-0">
        <Table>
          <TableHeader className="bg-slate-950/50">
            <TableRow className="border-slate-800">
              <TableHead className="text-slate-300">Name</TableHead>
              <TableHead className="text-slate-300">Category</TableHead>
              <TableHead className="text-slate-300">OTR Range</TableHead>
              <TableHead className="text-slate-300">WVTR Range</TableHead>
              <TableHead className="text-slate-300">Eco Profile</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MATERIALS_DB.map((mat) => (
              <TableRow key={mat.id} className="border-slate-800/50 hover:bg-slate-800/30">
                <TableCell className="font-medium text-slate-200">
                  {mat.name}
                  <span className="block text-xs text-slate-500 font-normal">{mat.fullName}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-950 border-slate-700 text-slate-300 capitalize">{mat.category}</Badge>
                </TableCell>
                <TableCell className="text-slate-400 text-sm">
                  {mat.otr.min} - {mat.otr.max} <span className="text-xs text-slate-600">cc</span>
                </TableCell>
                <TableCell className="text-slate-400 text-sm">
                  {mat.wvtr.min} - {mat.wvtr.max} <span className="text-xs text-slate-600">g</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {mat.sustainability.recyclable && <Badge variant="outline" className="bg-emerald-950/30 border-emerald-900 text-emerald-400">Recyclable</Badge>}
                    {mat.sustainability.biodegradable && <Badge variant="outline" className="bg-emerald-950/30 border-emerald-900 text-emerald-400">Bio</Badge>}
                    {!mat.sustainability.recyclable && !mat.sustainability.biodegradable && <span className="text-slate-600 text-sm">-</span>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
