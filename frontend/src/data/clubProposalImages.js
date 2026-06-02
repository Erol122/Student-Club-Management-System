import art from '../assets/club-images-webp/art.webp';
import chess from '../assets/club-images-webp/chess.webp';
import debate from '../assets/club-images-webp/debate.webp';
import fitness from '../assets/club-images-webp/fitness.webp';
import game from '../assets/club-images-webp/game.webp';
import hiking from '../assets/club-images-webp/hiking.webp';
import movie from '../assets/club-images-webp/movie.webp';
import music from '../assets/club-images-webp/music.webp';
import photography from '../assets/club-images-webp/photography.webp';
import study from '../assets/club-images-webp/study.webp';
import theatre from '../assets/club-images-webp/theatre.webp';

export const clubProposalImages = [
  { key: 'chess', label: 'Chess', src: chess },
  { key: 'art', label: 'Art', src: art },
  { key: 'music', label: 'Music', src: music },
  { key: 'debate', label: 'Debate', src: debate },
  { key: 'photography', label: 'Photography', src: photography },
  { key: 'theatre', label: 'Theatre', src: theatre },
  { key: 'fitness', label: 'Fitness', src: fitness },
  { key: 'hiking', label: 'Hiking', src: hiking },
  { key: 'study', label: 'Study', src: study },
  { key: 'game', label: 'Gaming', src: game },
  { key: 'movie', label: 'Movies', src: movie },
];

export const clubProposalImageByKey = new Map(
  clubProposalImages.map((image) => [image.key, image])
);
