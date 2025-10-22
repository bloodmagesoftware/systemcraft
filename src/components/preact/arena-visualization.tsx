import { flushSync } from "preact/compat";
import { useState } from "preact/hooks";

let currentId = 0;
function nextId() {
	return ++currentId;
}

interface ArenaObject {
	id: number;
	size: number;
}

interface Arena {
	id: number;
	objects: ArenaObject[];
	sliderValue: number;
}

interface ArenaAllocatorVisualizerProps {
	className?: string;
}

const ArenaAllocatorVisualizer = (props: ArenaAllocatorVisualizerProps) => {
	const [arenas, setArenas] = useState<Arena[]>(() => [
		{ id: nextId(), objects: [], sliderValue: 20 },
		{ id: nextId(), objects: [], sliderValue: 20 },
		{ id: nextId(), objects: [], sliderValue: 20 },
	]);

	const updateSliderValue = (arenaId: number, value: number) => {
		setArenas((prev) =>
			prev.map((arena) =>
				arena.id === arenaId ? { ...arena, sliderValue: value } : arena,
			),
		);
	};

	const addObject = (arenaId: number) => {
		if (!document.startViewTransition) {
			setArenas((prev) =>
				prev.map((arena) => {
					if (arena.id !== arenaId) return arena;

					const newObject: ArenaObject = {
						id: Date.now() + Math.random(),
						size: arena.sliderValue,
					};

					return {
						...arena,
						objects: [...arena.objects, newObject],
					};
				}),
			);
			return;
		}

		document.startViewTransition(() => {
			flushSync(() => {
				setArenas((prev) =>
					prev.map((arena) => {
						if (arena.id !== arenaId) return arena;

						const newObject: ArenaObject = {
							id: Date.now() + Math.random(),
							size: arena.sliderValue,
						};

						return {
							...arena,
							objects: [...arena.objects, newObject],
						};
					}),
				);
			});
		});
	};

	const addArena = () => {
		const newArena: Arena = {
			id: nextId(),
			objects: [],
			sliderValue: 20,
		};

		if (!document.startViewTransition) {
			setArenas((prev) => [...prev, newArena]);
			return;
		}

		document.startViewTransition(() => {
			flushSync(() => {
				setArenas((prev) => [...prev, newArena]);
			});
		});
	};

	const removeArena = async (arenaId: number) => {
		const arena = arenas.find((a) => a.id === arenaId);
		if (!arena) return;

		if (!document.startViewTransition) {
			setArenas((prev) => prev.filter((arena) => arena.id !== arenaId));
			return;
		}

		await document.startViewTransition(() => {
			flushSync(() => {
				setArenas((prev) => prev.filter((arena) => arena.id !== arenaId));
			});
		}).finished;
	};

	return (
		<div
			className="flex items-start gap-4 overflow-x-auto"
			style={{
				padding: "0 calc(50vw - min(100vw, var(--container-5xl)) / 2)",
			}}
		>
			{arenas.map((arena) => (
				<div
					key={arena.id}
					className="flex-shrink-0 w-48 bg-gray-900 rounded-lg p-4"
					style={{ viewTransitionName: `arena-${arena.id}` }}
				>
					<div className="flex justify-between items-center mb-3">
						<span className="text-gray-400 text-sm font-semibold">
							Arena {arena.id}
						</span>
						<button
							type="button"
							onClick={() => removeArena(arena.id)}
							className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer select-none"
							aria-label="Remove arena"
						>
							×
						</button>
					</div>

					<div className="mb-4 space-y-2">
						<div className="flex items-center justify-between text-gray-400 text-xs">
							Size: {arena.sliderValue} bytes
						</div>
						<input
							type="range"
							min="10"
							max="50"
							value={arena.sliderValue}
							onInput={(e) =>
								updateSliderValue(
									arena.id,
									parseInt((e.target as HTMLInputElement).value),
								)
							}
							className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
						/>
						<button
							type="button"
							onClick={() => addObject(arena.id)}
							className="w-full py-1 px-3 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded transition-colors cursor-pointer select-none"
						>
							Add Object
						</button>
					</div>

					<div className="space-y-2 max-h-64 overflow-y-auto">
						{arena.objects.length === 0 ? (
							<div className="text-gray-600 text-xs text-center py-4">
								No objects allocated
							</div>
						) : (
							arena.objects.map((obj) => (
								<div
									key={obj.id}
									className="arena-object bg-blue-600 rounded flex items-center justify-center text-white text-xs font-mono"
									style={{
										height: `${obj.size}px`,
									}}
								>
									{obj.size}
								</div>
							))
						)}
					</div>
				</div>
			))}

			<button
				type="button"
				onClick={addArena}
				className="flex-shrink-0 w-48 h-32 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-500 hover:border-gray-500 hover:text-gray-400 transition-colors cursor-pointer"
				style={{ viewTransitionName: "addArenaButton" }}
			>
				<span className="text-2xl select-none">+</span>
			</button>
		</div>
	);
};

export default ArenaAllocatorVisualizer;
