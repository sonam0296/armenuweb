import useSound from 'use-sound';
import boopSfx from '../../../assets/sounds/ding.mp3';

const BoopButton = () => {
  const [play] = useSound(boopSfx);
  return <button onClick={play}>Boop!</button>;
};