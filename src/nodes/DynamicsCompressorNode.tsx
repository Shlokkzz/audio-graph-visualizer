import React from 'react';
interface DynamicsCompressorNodeProps {
  data: {
    id: string;
    label: string;
    type: "dynamicsCompressor";
    threshold: number;
    knee: number;
    attack: number;
    release: number;
    ratio: number;
  };
}
const DynamicsCompressorNode :React.FC<DynamicsCompressorNodeProps>= ({ data }) => {
  return (
    <div style={{ padding: 10, background: '#03A9F4' }}>
      <strong>{data.label}</strong>
      <div>Type: {data.type}</div>
      <div>Threshold: {data.threshold}</div>
      <div>Knee: {data.knee}</div>
      <div>Attack: {data.attack}</div>
      <div>Release: {data.release}</div>
      <div>Ratio: {data.ratio}</div>
    </div>
  );
};

export default DynamicsCompressorNode;