"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import webData from '@/app/data/web.json';
import lowData from '@/app/data/low.json';

const searchData = {
	web: webData,
	low: lowData
};

const addToIndex = (word: string, item: any, index: Map<string, any[]>) => {
	if (!index.has(word)) {
		index.set(word, []);
	}
	index.get(word)?.push(item);
};

const indexText = (text: string, item: any, index: Map<string, any[]>) => {
	if (!text) return;
	const words = text.toLowerCase().split(/\s+/);
	words.forEach(word => addToIndex(word, item, index));
};

const createSearchIndex = () => {
	const index = new Map();

	Object.entries(searchData).forEach(([path, data]) => {
		data.months.forEach((month: any) => {
			const processTask = (task: any) => {
				const result = {
					path,
					month: month.month,
					lesson: data.lesson,
					content: task.content,
					type: task.type,
					matchedField: '',
					matchedText: ''
				};

				// Index all possible fields
				indexText(task.content, { ...result, matchedField: 'content', matchedText: task.content }, index);
				indexText(task.url, { ...result, matchedField: 'url', matchedText: task.url }, index);

				// Index arrays
				if (task.urls?.length) {
					task.urls.forEach((url: string) => {
						indexText(url, { ...result, matchedField: 'urls', matchedText: url }, index);
					});
				}

				if (task.list?.length) {
					task.list.forEach((item: string) => {
						indexText(item, { ...result, matchedField: 'list', matchedText: item }, index);
					});
				}

				// Index details
				if (task.details) {
					if (task.details.features?.length) {
						task.details.features.forEach((feature: string) => {
							indexText(feature, { ...result, matchedField: 'features', matchedText: feature }, index);
						});
					}

					if (task.details.tips?.length) {
						task.details.tips.forEach((tip: string) => {
							indexText(tip, { ...result, matchedField: 'tips', matchedText: tip }, index);
						});
					}

					if (task.details.examples?.length) {
						task.details.examples.forEach((example: string) => {
							indexText(example, { ...result, matchedField: 'examples', matchedText: example }, index);
						});
					}

					if (task.details.level) {
						indexText(task.details.level, { ...result, matchedField: 'level', matchedText: task.details.level }, index);
					}
				}
			};

			if (month.weeks) {
				month.weeks.forEach((week: Week) => {
					if (week.tasks) {
						week.tasks.forEach(processTask);
					}
				});
			}

			if (month.tasks) {
				month.tasks.forEach(processTask);
			}
		});
	});

	return index;
};

const SearchBar = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<any>([]);
	const inputRef = useRef<HTMLInputElement>(null);
	const router = useRouter();

	const searchIndex = useMemo(() => createSearchIndex(), []);

	const handleSearch = (searchQuery: string) => {
		if (!searchQuery.trim()) {
			setResults([]);
			return;
		}

		const words = searchQuery.toLowerCase().split(/\s+/);
		const resultMap = new Map();

		words.forEach(word => {
			searchIndex.forEach((items, indexWord) => {
				if (indexWord.includes(word)) {
					items.forEach((item: any) => {
						const key = `${item.path}-${item.month}-${item.content}-${item.matchedField}`;
						if (!resultMap.has(key)) {
							resultMap.set(key, { ...item, score: 0 });
						}
						const score = indexWord === word ? 2 : 1;
						resultMap.get(key).score += score;
					});
				}
			});
		});

		const sortedResults = Array.from(resultMap.values())
			.sort((a, b) => b.score - a.score)
			.slice(0, 10);

		setResults(sortedResults);
	};

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setIsOpen(true);
			}
			if (e.key === 'Escape') {
				setIsOpen(false);
				setResults([]);
				setQuery('');
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, []);

	useEffect(() => {
		if (isOpen) {
			inputRef.current?.focus();
		}
	}, [isOpen]);

	const handleResultClick = (result: any) => {
		router.push(`/${result.path}?m=${result.month}`);
		setIsOpen(false);
		setQuery('');
	};


	return (
		<>
			<div className='fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full px-4 sm:px-0 sm:w-auto'>
				<button
					onClick={() => setIsOpen(true)}
					className="flex w-full sm:w-96 justify-between bg-neutral-900 items-center gap-2 px-3 py-2 text-sm text-gray-400 border border-emerald-400 hover:border-gray-300"
				>
					<div className="flex gap-4 items-center">
						<svg className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
							<path d="M6 2h8v2H6V2zM4 6V4h2v2H4zm0 8H2V6h2v8zm2 2H4v-2h2v2zm8 0v2H6v-2h8zm2-2h-2v2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2v-2zm0-8h2v8h-2V6zm0 0V4h-2v2h2z" fill="currentColor" />
						</svg>
						<span className='text-xl'>Search...</span>
					</div>
					<span className="ml-2 border border-emerald-400 px-2 py-0.5">⌘ K</span>
				</button>
			</div>

			{isOpen && (
				<div className="fixed inset-0 z-50">
					<div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />

					<div className="relative w-full mx-4 sm:mx-auto sm:max-w-2xl mt-20">
						<div className="bg-neutral-900 shadow-xl overflow-hidden">
							<div className="relative">
								<input
									ref={inputRef}
									type="text"
									value={query}
									onChange={(e) => {
										setQuery(e.target.value);
										handleSearch(e.target.value);
									}}
									placeholder="Search content..."
									className="w-full px-4 py-4 border-b border-neutral-700 text-emerald-300 text-xl bg-neutral-900 placeholder:text-neutral-500 focus:outline-none"
								/>
								<button
									onClick={() => setIsOpen(false)}
									className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
								>
									<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
										<path d="M5 5h2v2H5V5zm4 4H7V7h2v2zm2 2H9V9h2v2zm2 0h-2v2H9v2H7v2H5v2h2v-2h2v-2h2v-2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2v-2zm2-2v2h-2V9h2zm2-2v2h-2V7h2zm0 0V5h2v2h-2z" fill="currentColor" />
									</svg>
								</button>
							</div>

							{results.length > 0 && (
								<div className="max-h-96 overflow-y-auto p-4">
									{results.map((result: any, index: number) => (
										<button
											key={index}
											onClick={() => handleResultClick(result)}
											className="w-full text-xl p-4 text-left hover:bg-neutral-800 text-white group"
										>
											<div className="font-medium text-emerald-500">
												{result.content}
											</div>
											<div className="mt-1 text-neutral-500">
												{result.lesson} - Month {result.month}
											</div>
										</button>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default SearchBar;