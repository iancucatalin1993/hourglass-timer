import React, {useState, useEffect, useCallback} from 'react';
import CssHourglassDisplay from './components/CssHourglassDisplay';
import {TimerStatus} from './types';
import './components/CssHourglassDisplay.css';
// import HourglassDisplay from './components/HourglassDisplay'; // Old SVG component

let focusOutTime: number;
let focusOutRemainingSeconds: number;

// required global scope state, to not be recreated on re-render
// and to be able to capture the whole scope
let currentRemainingSeconds: number,
    setCurrentRemainingSeconds: (arg0: any) => void,
    timerStatus: TimerStatus,
    setTimerStatus: (arg0: TimerStatus) => void;

// window focus in/out event to calibrate the pause of setInterval()
// while the window is in the background
window.addEventListener("blur", focusOutListener);

function focusInListener()
{
    window.removeEventListener("focus", focusInListener);
    setCurrentRemainingSeconds(() => {
        const focusInTime = Date.now();
        const seconds = (focusInTime - focusOutTime) / 1000;
        console.log("Calibration: ", focusOutRemainingSeconds - seconds);
        console.log("Actual: ", currentRemainingSeconds);

        return Math.round(focusOutRemainingSeconds - seconds > 0 ? focusOutRemainingSeconds - seconds : 0);
    });
}

function focusOutListener()
{
    if (timerStatus !== TimerStatus.Running) {
        return;
    }
    focusOutTime = Date.now();
    focusOutRemainingSeconds = currentRemainingSeconds;
    console.log("Focus out", focusOutRemainingSeconds);
    window.addEventListener("focus", focusInListener);
}


// helper to format seconds into HH:MM:SS
function formatTime(totalSeconds: number): string
{
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const App: React.FC = () =>
{
    const [inputHours, setInputHours] = useState<string>('0');
    const [inputMinutes, setInputMinutes] = useState<string>('5');
    const [inputSeconds, setInputSeconds] = useState<string>('0');

    const [totalSetDurationSeconds, setTotalSetDurationSeconds] = useState<number>(0);
    [currentRemainingSeconds, setCurrentRemainingSeconds] = useState<number>(0);
    [timerStatus, setTimerStatus] = useState<TimerStatus>(TimerStatus.Idle);

    useEffect(() =>
    {
        let intervalId: number | undefined = undefined;
        if (timerStatus === TimerStatus.Running) {
            intervalId = window.setInterval(() => {
                setCurrentRemainingSeconds(prevSeconds => {
                    if (prevSeconds <= 1) {
                        setTimerStatus(TimerStatus.Finished);
                        notify("Hourglass - Time's up!");
                        return 0;
                    }
                    return prevSeconds - 1;
                });
            }, 1000);
        }

        return () => {
            if (intervalId) {
                window.clearInterval(intervalId);
            }
        };
    }, [timerStatus]);

    const handleTimeInputChange = (
        setter: React.Dispatch<React.SetStateAction<string>>,
        value: string,
        max: number
    ) => {
        const numValue = parseInt(value, 10);
        if (value === '' || (numValue >= 0 && numValue <= max)) {
            setter(value);
        } else if (numValue > max) {
            setter(String(max));
        } else if (numValue < 0) {
            setter('0');
        }
    };

    const startTimer = useCallback(() => {
        const h = parseInt(inputHours, 10) || 0;
        const m = parseInt(inputMinutes, 10) || 0;
        const s = parseInt(inputSeconds, 10) || 0;
        const totalDuration = h * 3600 + m * 60 + s;

        if (totalDuration <= 0) {
            return;
        }

        setTotalSetDurationSeconds(totalDuration);
        setCurrentRemainingSeconds(totalDuration);
        setTimerStatus(TimerStatus.Running);
    }, [inputHours, inputMinutes, inputSeconds]);

    const pauseTimer = useCallback(() => {
        setTimerStatus(TimerStatus.Paused);
    }, []);

    const resumeTimer = useCallback(() => {
        setTimerStatus(TimerStatus.Running);
    }, []);

    const resetTimer = useCallback(() => {
        setTimerStatus(TimerStatus.Idle);
        setCurrentRemainingSeconds(0);
        setTotalSetDurationSeconds(0);
    }, []);

    const progress = totalSetDurationSeconds > 0
        ? (totalSetDurationSeconds - currentRemainingSeconds) / totalSetDurationSeconds
        : 0;

    const isInputDisabled = timerStatus === TimerStatus.Running || timerStatus === TimerStatus.Paused;

    const buttonBaseClass = "px-6 py-3 rounded-lg font-semibold text-white transition-all duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-50";
    const primaryButtonClass = `${buttonBaseClass} bg-sky-600 hover:bg-sky-700 focus:ring-sky-500`;
    const secondaryButtonClass = `${buttonBaseClass} bg-slate-600 hover:bg-slate-700 focus:ring-slate-500`;
    const warningButtonClass = `${buttonBaseClass} bg-amber-500 hover:bg-amber-600 focus:ring-amber-400`;
    const disabledButtonClass = "opacity-50 cursor-not-allowed";

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-slate-100 selection:bg-sky-500 selection:text-white">
            <header className="timer-info-header mb-8 text-center">
                <h1 className="text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                    Hourglass Timer
                </h1>
                <p className="countdown mt-4 text-6xl font-mono tracking-wider text-slate-200">
                    {formatTime(currentRemainingSeconds)}
                </p>
                {timerStatus === TimerStatus.Finished && (
                    <p className="finish-label mt-2 text-2xl text-green-400 animate-pulse">Time's up!</p>
                )}
            </header>

            {/* Use the new CSS Hourglass Display */}
            {/* The sizing of CssHourglassDisplay is intrinsic to its own CSS now */}
            <div className="my-4 flex justify-center items-center"> {/* Container for the CSS hourglass */}
                <CssHourglassDisplay progress={progress} timerStatus={timerStatus}/>
            </div>

            <section className="mt-2 w-full max-w-md">
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {(['Hours', 'Minutes', 'Seconds'] as const).map((label, idx) => {
                        const value = [inputHours, inputMinutes, inputSeconds][idx];
                        const setter = [setInputHours, setInputMinutes, setInputSeconds][idx];
                        const max = label === 'Hours' ? 99 : 59;
                        return (
                            <div key={label}>
                                <label htmlFor={label.toLowerCase()} className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
                                <input
                                    type="number"
                                    id={label.toLowerCase()}
                                    value={value}
                                    onChange={(e) => handleTimeInputChange(setter, e.target.value, max)}
                                    onFocus={(e) => e.target.select()}
                                    min="0"
                                    max={max}
                                    disabled={isInputDisabled}
                                    className="w-full p-3 text-center bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors text-lg appearance-none"
                                />
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {timerStatus === TimerStatus.Idle || timerStatus === TimerStatus.Finished ? (
                        <button onClick={startTimer} className={`${primaryButtonClass} col-span-2`}>
                            Start
                        </button>
                    ) : timerStatus === TimerStatus.Running ? (
                        <button onClick={pauseTimer} className={`${warningButtonClass} col-span-2`}>
                            Pause
                        </button>
                    ) : ( // Paused
                        <button onClick={resumeTimer} className={`${primaryButtonClass} col-span-2`}>
                            Resume
                        </button>
                    )}
                    <button
                        onClick={resetTimer}
                        disabled={timerStatus === TimerStatus.Idle && totalSetDurationSeconds === 0}
                        className={`${secondaryButtonClass} col-span-2 ${timerStatus === TimerStatus.Idle && totalSetDurationSeconds === 0 ? disabledButtonClass : ''}`}
                    >
                        Reset
                    </button>
                </div>
            </section>
        </div>
    );
};

// show desktop notification
function notify(message: string): void
{
    if (!("Notification" in window)) {
        return;
    }
    // check whether notification permissions have already been granted
    if (Notification.permission === "granted") {
        new Notification(message);
    } else if (Notification.permission !== "denied") {
        // ask the user for permission
        Notification.requestPermission().then((permission) => {
            // if the user accepts, create a notification
            if (permission === "granted") {
                new Notification(message);
            }
        });
    }
}

export default App;