import React from 'react';
import { HazardIqMap } from '../map/HazardIqMap';

interface ChennaiMapProps {
  risks?: any[];
  selectedCategory?: 'all' | 'safe' | 'risk' | 'shelters' | 'hospitals';
  onSelectFeature?: (feature: any) => void;
  selectedZoneId?: string;
  className?: string;
}

export default function ChennaiMap({
  risks,
  selectedCategory = 'all',
  onSelectFeature,
  selectedZoneId,
  className,
}: ChennaiMapProps) {
  return (
    <HazardIqMap
      onSelectFeature={onSelectFeature}
      selectedZoneId={selectedZoneId}
      className={className}
    />
  );
}
