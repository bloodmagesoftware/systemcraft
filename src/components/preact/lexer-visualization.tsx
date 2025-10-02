import { useEffect, useState } from "preact/hooks";

type Token = {
	type: string;
	value: string;
};

type LexerStep = {
	currentIndex: number;
	currentChar: string | null;
	tokens: Token[];
	currentToken: string;
};

type Props = {
	input: string;
	steps: LexerStep[];
	stepDelay?: number;
};

export default function LexerVisualization({
	input,
	steps,
	stepDelay = 800,
}: Props) {
	const [currentStep, setCurrentStep] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);

	useEffect(() => {
		if (!isPlaying || currentStep >= steps.length - 1) return;

		const timer = setTimeout(() => {
			setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
		}, stepDelay);

		return () => clearTimeout(timer);
	}, [currentStep, isPlaying, steps.length, stepDelay]);

	useEffect(() => {
		if (currentStep >= steps.length - 1) {
			setIsPlaying(false);
		}
	}, [currentStep, steps.length]);

	const step = steps[currentStep];

	const handlePlayPause = () => {
		if (currentStep >= steps.length - 1) {
			setCurrentStep(0);
			setIsPlaying(true);
		} else {
			setIsPlaying(!isPlaying);
		}
	};

	const handleStepForward = () => {
		setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
	};

	const handleStepBackward = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 0));
	};

	return (
		<div className="rounded border border-gray-700 bg-gray-800 p-6 my-6">
			<div className="mb-4 flex items-center gap-2">
				<button
					onClick={handlePlayPause}
					className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-gray-100 hover:bg-gray-600"
					type="button"
				>
					{isPlaying
						? "Pause"
						: currentStep >= steps.length - 1
							? "Replay"
							: "Play"}
				</button>
				{!isPlaying && (
					<>
						<button
							onClick={handleStepBackward}
							disabled={currentStep === 0}
							className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-gray-100 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
							type="button"
						>
							← Step Back
						</button>
						<button
							onClick={handleStepForward}
							disabled={currentStep >= steps.length - 1}
							className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-gray-100 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
							type="button"
						>
							Step Forward →
						</button>
					</>
				)}
			</div>

			<div className="mb-6">
				<div className="mb-2 text-sm font-medium text-gray-300">Input:</div>
				<div className="flex gap-1 font-mono text-lg">
					{input.split("").map((char, idx) => (
						<span
							key={idx}
							className={`inline-block min-w-[1.5rem] text-center rounded px-1 transition-colors ${
								idx === step.currentIndex
									? "bg-blue-600 text-white"
									: idx < step.currentIndex
										? "bg-gray-600 text-gray-400"
										: "bg-gray-900 text-gray-100"
							}`}
						>
							{char}
						</span>
					))}
				</div>
			</div>

			<div className="mb-4">
				<div className="mb-2 text-sm font-medium text-gray-300">
					Current Token Building:
				</div>
				<div className="rounded bg-gray-900 p-3 font-mono text-gray-100">
					{step.currentToken || "(empty)"}
				</div>
			</div>

			<div>
				<div className="mb-2 text-sm font-medium text-gray-300">Tokens:</div>
				<div className="flex flex-wrap gap-2">
					{step.tokens.length === 0 ? (
						<div className="text-gray-500 text-sm">(none yet)</div>
					) : (
						step.tokens.map((token, idx) => (
							<div
								key={idx}
								className="rounded border border-gray-600 bg-gray-900 px-3 py-1.5"
							>
								<div className="font-mono text-xs text-gray-400">
									{token.type}
								</div>
								<div className="font-mono text-sm text-gray-100">
									{token.value}
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
