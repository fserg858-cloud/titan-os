import { useState, useRef, useEffect } from 'react';
import { Camera, Mic, Droplet, Moon, Zap, Calendar, Square, Loader2, Utensils, RotateCcw } from 'lucide-react';
import Webcam from 'react-webcam';
import './App.css';

// Types for AI responses
interface NutritionData {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface VoiceAction {
  action: 'add_water' | 'add_sleep' | 'log_food';
  // For water and sleep
  value?: number;
  unit?: string;
  // For food
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  food_name?: string;
}

function App() {
  // Dashboard state with lazy initialization from localStorage
  const [waterIntake, setWaterIntake] = useState(() => {
    const saved = localStorage.getItem('waterIntake');
    return saved ? parseFloat(saved) : 0;
  });
  const [sleepHours, setSleepHours] = useState(() => {
    const saved = localStorage.getItem('sleepHours');
    return saved ? parseFloat(saved) : 0;
  });
  const [energyLevel, setEnergyLevel] = useState(() => {
    const saved = localStorage.getItem('energyLevel');
    return saved ? parseFloat(saved) : 5;
  });
  const [caloriesIntake, setCaloriesIntake] = useState(() => {
    const saved = localStorage.getItem('caloriesIntake');
    return saved ? parseFloat(saved) : 0;
  });
  const [proteinIntake, setProteinIntake] = useState(() => {
    const saved = localStorage.getItem('proteinIntake');
    return saved ? parseFloat(saved) : 0;
  });
  const [carbsIntake, setCarbsIntake] = useState(() => {
    const saved = localStorage.getItem('carbsIntake');
    return saved ? parseFloat(saved) : 0;
  });
  const [fatIntake, setFatIntake] = useState(() => {
    const saved = localStorage.getItem('fatIntake');
    return saved ? parseFloat(saved) : 0;
  });
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [cameraError, setCameraError] = useState('');
  
  const webcamRef = useRef<Webcam>(null);

  // Save water intake to localStorage
  useEffect(() => {
    localStorage.setItem('waterIntake', String(waterIntake));
    console.log('💾 [STORAGE] Water saved:', waterIntake);
  }, [waterIntake]);

  // Save sleep hours to localStorage
  useEffect(() => {
    localStorage.setItem('sleepHours', String(sleepHours));
    console.log('💾 [STORAGE] Sleep saved:', sleepHours);
  }, [sleepHours]);

  // Save energy level to localStorage
  useEffect(() => {
    localStorage.setItem('energyLevel', String(energyLevel));
    console.log('💾 [STORAGE] Energy saved:', energyLevel);
  }, [energyLevel]);

  // Save calories to localStorage
  useEffect(() => {
    localStorage.setItem('caloriesIntake', String(caloriesIntake));
    console.log('💾 [STORAGE] Calories saved:', caloriesIntake);
  }, [caloriesIntake]);

  // Save protein to localStorage
  useEffect(() => {
    localStorage.setItem('proteinIntake', String(proteinIntake));
    console.log('💾 [STORAGE] Protein saved:', proteinIntake);
  }, [proteinIntake]);

  // Save carbs to localStorage
  useEffect(() => {
    localStorage.setItem('carbsIntake', String(carbsIntake));
    console.log('💾 [STORAGE] Carbs saved:', carbsIntake);
  }, [carbsIntake]);

  // Save fat to localStorage
  useEffect(() => {
    localStorage.setItem('fatIntake', String(fatIntake));
    console.log('💾 [STORAGE] Fat saved:', fatIntake);
  }, [fatIntake]);

  // Reset all data
  const handleResetDay = () => {
    const confirmed = window.confirm(
      '⚠️ Reset Day?\n\nThis will clear all your tracking data for today:\n• Nutrition (calories, protein, carbs, fat)\n• Water intake\n• Sleep hours\n• Energy level\n\nAre you sure you want to continue?'
    );

    if (confirmed) {
      console.log('🔄 [RESET] Resetting all tracking data...');
      setWaterIntake(0);
      setSleepHours(0);
      setEnergyLevel(5);
      setCaloriesIntake(0);
      setProteinIntake(0);
      setCarbsIntake(0);
      setFatIntake(0);
      console.log('✅ [RESET] All data reset successfully');
    }
  };

  const incrementWater = () => setWaterIntake(prev => prev + 250);
  const decrementWater = () => setWaterIntake(prev => Math.max(0, prev - 250));
  
  const incrementSleep = () => setSleepHours(prev => prev + 0.5);
  const decrementSleep = () => setSleepHours(prev => Math.max(0, prev - 0.5));

  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  // Start recording function
  const startRecording = async () => {
    console.log('🎤 [START] Initiating recording...');
    setVoiceError('');
    setTranscription('');
    
    try {
      // Request microphone permission
      console.log('🎤 [PERMISSION] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ [PERMISSION] Microphone access granted!');
      
      // Clear previous audio chunks
      audioChunksRef.current = [];
      
      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      console.log('🎤 [RECORDER] MediaRecorder created with mimeType:', mediaRecorder.mimeType);
      
      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('🎤 [DATA] Audio chunk received, size:', event.data.size, 'bytes');
        }
      };
      
      // Handle stop event
      mediaRecorder.onstop = async () => {
        console.log('🎤 [STOP] Recording stopped, processing audio...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('🎤 [AUDIO] Audio blob created, total size:', audioBlob.size, 'bytes');
        
        // Stop all tracks
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('🎤 [CLEANUP] Audio track stopped');
        });
        
        // Send to OpenAI Whisper API
        await transcribeAudio(audioBlob);
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      console.log('✅ [RECORDING] Recording started successfully!');
      
    } catch (err) {
      console.error('❌ [ERROR] Failed to start recording:', err);
      setVoiceError(`Failed to access microphone: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Stop recording function
  const stopRecording = () => {
    console.log('🛑 [STOP] Stopping recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('✅ [STOP] Recording stop signal sent');
    }
  };

  // Transcribe audio using OpenAI Whisper API
  const transcribeAudio = async (audioBlob: Blob) => {
    console.log('🤖 [WHISPER] Starting transcription...');
    setIsTranscribing(true);
    
    try {
      // Convert webm to a format OpenAI accepts (we'll send as is and let OpenAI handle it)
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');
      console.log('🤖 [WHISPER] Sending audio to OpenAI Whisper API via serverless function...');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      console.log('🤖 [RESPONSE] Received response, status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [ERROR] OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ [SUCCESS] Transcription received:', data.text);
      setTranscription(data.text);
      
      // Process the transcription with AI
      await processVoiceCommand(data.text);
      
    } catch (err) {
      console.error('❌ [ERROR] Transcription failed:', err);
      setVoiceError(`Transcription failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsTranscribing(false);
      console.log('🏁 [COMPLETE] Transcription process finished');
    }
  };

  // Process voice command with AI
  const processVoiceCommand = async (text: string) => {
    console.log('🧠 [AI] Processing voice command:', text);
    setIsProcessingVoice(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an AI Nutritionist and health tracker. Analyze the user input and extract health tracking actions. Return ONLY a valid JSON object.

WATER Actions:
If the user mentions drinking water/liquids, return:
{ "action": "add_water", "value": number, "unit": "ml" }

Examples:
- "I drank a glass of water" -> { "action": "add_water", "value": 250, "unit": "ml" }
- "I drank 2 glasses of water" -> { "action": "add_water", "value": 500, "unit": "ml" }
- "I drank 1 liter of water" -> { "action": "add_water", "value": 1000, "unit": "ml" }

Convert all water measurements to ml (1 glass = 250ml, 1 liter = 1000ml, 1 cup = 240ml).

SLEEP Actions:
If the user mentions sleep/nap, return:
{ "action": "add_sleep", "value": number, "unit": "hours" }

Examples:
- "I slept 7 hours" -> { "action": "add_sleep", "value": 7, "unit": "hours" }
- "I had a 30 minute nap" -> { "action": "add_sleep", "value": 0.5, "unit": "hours" }

Convert all sleep to hours (30 min = 0.5 hours).

FOOD Actions:
If the user mentions eating food, YOU MUST estimate the calories and macros based on your knowledge. Return:
{ "action": "log_food", "calories": number, "protein": number, "carbs": number, "fat": number, "food_name": "string" }

Examples:
- "I ate a Big Mac" -> { "action": "log_food", "calories": 550, "protein": 25, "carbs": 46, "fat": 30, "food_name": "Big Mac" }
- "I had a chicken breast" -> { "action": "log_food", "calories": 165, "protein": 31, "carbs": 0, "fat": 4, "food_name": "Chicken Breast" }
- "I ate pizza" -> { "action": "log_food", "calories": 285, "protein": 12, "carbs": 36, "fat": 10, "food_name": "Pizza Slice" }
- "I had a salad" -> { "action": "log_food", "calories": 150, "protein": 5, "carbs": 15, "fat": 8, "food_name": "Salad" }

Use your nutritional knowledge to provide realistic estimates. Protein, carbs, and fat should be in grams.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [ERROR] OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      console.log('🧠 [AI] Response:', aiResponse);

      // Parse the JSON response
      const actionData: VoiceAction = JSON.parse(aiResponse);
      
      // Apply the action to dashboard
      applyVoiceAction(actionData);
      
    } catch (err) {
      console.error('❌ [ERROR] Voice processing failed:', err);
      setVoiceError(`Failed to process command: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Apply voice action to dashboard
  const applyVoiceAction = (action: VoiceAction) => {
    console.log('✅ [ACTION] Applying:', action);
    
    switch (action.action) {
      case 'add_water':
        if (action.value) {
          setWaterIntake(prev => prev + action.value!);
          console.log('💧 [WATER] Added:', action.value, 'ml');
        }
        break;
      case 'add_sleep':
        if (action.value) {
          setSleepHours(prev => prev + action.value!);
          console.log('😴 [SLEEP] Added:', action.value, 'hours');
        }
        break;
      case 'log_food':
        if (action.calories !== undefined) {
          setCaloriesIntake(prev => prev + action.calories!);
          console.log('🍔 [FOOD] Added calories:', action.calories);
        }
        if (action.protein !== undefined) {
          setProteinIntake(prev => prev + action.protein!);
          console.log('🍔 [FOOD] Added protein:', action.protein, 'g');
        }
        if (action.carbs !== undefined) {
          setCarbsIntake(prev => prev + action.carbs!);
          console.log('🍔 [FOOD] Added carbs:', action.carbs, 'g');
        }
        if (action.fat !== undefined) {
          setFatIntake(prev => prev + action.fat!);
          console.log('🍔 [FOOD] Added fat:', action.fat, 'g');
        }
        if (action.food_name) {
          console.log('🍔 [FOOD] Logged:', action.food_name);
        }
        break;
    }
  };

  // Toggle recording
  const handleRecordingToggle = () => {
    console.log('🎯 [BUTTON] Recording button clicked, current state:', isRecording ? 'RECORDING' : 'STOPPED');
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Camera functions
  const openCamera = () => {
    setCameraError('');
    setIsCameraOpen(true);
    setCapturedImage(null);
    setNutritionData(null);
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
    setCapturedImage(null);
  };

  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setIsCameraOpen(false);
        console.log('📸 [CAMERA] Image captured');
      }
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    console.log('🍔 [NUTRITION] Starting image analysis...');
    setIsAnalyzingImage(true);
    setCameraError('');

    try {
      // Remove the data:image/jpeg;base64, prefix
      const base64Image = capturedImage.split(',')[1];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a nutrition analysis AI. Analyze food images and return nutritional information. Return ONLY a valid JSON object with this exact structure: { "food_name": "string", "calories": number, "protein": number, "carbs": number, "fat": number }. Provide estimates in grams for protein, carbs, and fat.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this food image. Return ONLY a JSON object with: { food_name: string, calories: number, protein: number, carbs: number, fat: number }. Provide realistic estimates.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [ERROR] OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      console.log('🍔 [NUTRITION] Response:', aiResponse);

      // Parse the JSON response
      const nutritionInfo: NutritionData = JSON.parse(aiResponse);
      setNutritionData(nutritionInfo);

      // Update dashboard with nutrition data
      setCaloriesIntake(prev => prev + nutritionInfo.calories);
      setProteinIntake(prev => prev + nutritionInfo.protein);
      setCarbsIntake(prev => prev + nutritionInfo.carbs);
      setFatIntake(prev => prev + nutritionInfo.fat);

      console.log('✅ [NUTRITION] Analysis complete:', nutritionInfo);

    } catch (err) {
      console.error('❌ [ERROR] Image analysis failed:', err);
      setCameraError(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setNutritionData(null);
    setIsCameraOpen(true);
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-white">
      {/* Header */}
      <header className="bg-cyber-card border-b border-cyber-accent/20 p-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyber-accent to-cyber-purple bg-clip-text text-transparent">
            TITAN OS
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <button
              onClick={handleResetDay}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-500/50 rounded-lg text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
              title="Reset all tracking data"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Day</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Dashboard Section */}
        <section className="bg-cyber-card rounded-xl p-6 border border-cyber-accent/20 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-cyber-accent flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Dashboard
          </h2>
          
          <div className="space-y-6">
            {/* Nutrition Stats */}
            <div className="bg-cyber-bg rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Utensils className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-green-400">Today's Nutrition</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Calories:</span>
                  <span className="ml-2 font-bold text-green-400">{caloriesIntake} kcal</span>
                </div>
                <div>
                  <span className="text-gray-400">Protein:</span>
                  <span className="ml-2 font-bold text-green-400">{proteinIntake}g</span>
                </div>
                <div>
                  <span className="text-gray-400">Carbs:</span>
                  <span className="ml-2 font-bold text-green-400">{carbsIntake}g</span>
                </div>
                <div>
                  <span className="text-gray-400">Fat:</span>
                  <span className="ml-2 font-bold text-green-400">{fatIntake}g</span>
                </div>
              </div>
            </div>

            {/* Water Tracker */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">Water</span>
                </div>
                <span className="text-2xl font-bold text-blue-400">{waterIntake} ml</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={decrementWater}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 py-3 rounded-lg font-bold text-xl transition-colors"
                >
                  -
                </button>
                <button
                  onClick={incrementWater}
                  className="flex-1 bg-cyber-accent hover:bg-indigo-600 active:bg-indigo-700 py-3 rounded-lg font-bold text-xl transition-colors"
                >
                  +
                </button>
              </div>
              <div className="mt-2 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((waterIntake / 2000) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Sleep Tracker */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-purple-400" />
                  <span className="font-medium">Sleep</span>
                </div>
                <span className="text-2xl font-bold text-purple-400">{sleepHours} hrs</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={decrementSleep}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 py-3 rounded-lg font-bold text-xl transition-colors"
                >
                  -
                </button>
                <button
                  onClick={incrementSleep}
                  className="flex-1 bg-cyber-accent hover:bg-indigo-600 active:bg-indigo-700 py-3 rounded-lg font-bold text-xl transition-colors"
                >
                  +
                </button>
              </div>
              <div className="mt-2 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((sleepHours / 8) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Energy Level */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="font-medium">Energy Level</span>
                </div>
                <span className="text-2xl font-bold text-yellow-400">{energyLevel}/10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </section>

        {/* Nutrition AI Camera */}
        <section className="bg-cyber-card rounded-xl p-6 border border-cyber-accent/20 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-cyber-purple flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Nutrition AI Camera
          </h2>
          
          <div className="bg-cyber-bg rounded-lg p-4 border-2 border-dashed border-gray-600">
            {isCameraOpen ? (
              <div className="space-y-4">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="w-full rounded-lg"
                  videoConstraints={{
                    facingMode: 'environment'
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={captureImage}
                    className="flex-1 bg-cyber-purple hover:bg-purple-600 active:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Capture
                  </button>
                  <button
                    onClick={closeCamera}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : capturedImage ? (
              <div className="space-y-4">
                <img src={capturedImage} alt="Captured food" className="w-full rounded-lg" />
                
                {isAnalyzingImage ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <Loader2 className="w-12 h-12 text-cyber-purple mb-2 animate-spin" />
                    <p className="text-gray-400">Analyzing nutrition...</p>
                  </div>
                ) : nutritionData ? (
                  <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
                    <h3 className="text-green-400 font-semibold mb-2 text-lg">{nutritionData.food_name}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Calories:</span>
                        <span className="ml-2 font-bold text-green-400">{nutritionData.calories} kcal</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Protein:</span>
                        <span className="ml-2 font-bold text-green-400">{nutritionData.protein}g</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Carbs:</span>
                        <span className="ml-2 font-bold text-green-400">{nutritionData.carbs}g</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Fat:</span>
                        <span className="ml-2 font-bold text-green-400">{nutritionData.fat}g</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">✅ Added to your daily nutrition totals</p>
                  </div>
                ) : null}

                {cameraError && (
                  <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                    <p className="text-red-400 text-sm">{cameraError}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {!nutritionData && !isAnalyzingImage && (
                    <button
                      onClick={analyzeImage}
                      className="flex-1 bg-cyber-purple hover:bg-purple-600 active:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Analyze Nutrition
                    </button>
                  )}
                  <button
                    onClick={retakePhoto}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    {nutritionData ? 'New Photo' : 'Retake'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <Camera className="w-16 h-16 text-gray-500 mb-4" />
                <p className="text-gray-400 text-center mb-4">
                  Take a photo of your meal to analyze nutrition
                </p>
                <button 
                  onClick={openCamera}
                  className="bg-cyber-purple hover:bg-purple-600 active:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Open Camera
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Voice Brain Dump */}
        <section className="bg-cyber-card rounded-xl p-6 border border-cyber-accent/20 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-cyber-pink flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice Brain Dump
          </h2>
          <div className="bg-cyber-bg rounded-lg p-8 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center min-h-[200px]">
            {isTranscribing ? (
              <>
                <Loader2 className="w-16 h-16 text-cyber-pink mb-4 animate-spin" />
                <p className="text-gray-400 text-center mb-4">
                  Transcribing with AI...
                </p>
              </>
            ) : isProcessingVoice ? (
              <>
                <Loader2 className="w-16 h-16 text-purple-500 mb-4 animate-spin" />
                <p className="text-gray-400 text-center mb-4">
                  Processing command...
                </p>
              </>
            ) : isRecording ? (
              <>
                <div className="relative mb-4">
                  <Mic className="w-16 h-16 text-red-500 animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping"></div>
                </div>
                <p className="text-red-400 text-center mb-4 font-semibold">
                  Recording in progress...
                </p>
              </>
            ) : (
              <>
                <Mic className="w-16 h-16 text-gray-500 mb-4" />
                <p className="text-gray-400 text-center mb-4">
                  Record your thoughts and track health with voice
                </p>
                <p className="text-xs text-gray-500 text-center mb-4">
                  Try: "I drank 2 glasses of water" or "I slept 7 hours"
                </p>
              </>
            )}
            
            <button 
              onClick={handleRecordingToggle}
              disabled={isTranscribing || isProcessingVoice}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
                  : (isTranscribing || isProcessingVoice)
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-cyber-pink hover:bg-pink-600 active:bg-pink-700'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-5 h-5" />
                  <span translate="no">Stop Recording</span>
                </>
              ) : (isTranscribing || isProcessingVoice) ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span translate="no">Processing...</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span translate="no">Start Recording</span>
                </>
              )}
            </button>

            {voiceError && (
              <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg w-full">
                <p className="text-red-400 text-sm">{voiceError}</p>
              </div>
            )}

            {transcription && (
              <div className="mt-4 p-4 bg-green-900/30 border border-green-500/50 rounded-lg w-full">
                <h3 className="text-green-400 font-semibold mb-2">Transcription:</h3>
                <p className="text-gray-300 text-sm">{transcription}</p>
                {!isProcessingVoice && (
                  <p className="text-xs text-green-500 mt-2">✅ Command processed and applied to dashboard</p>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
