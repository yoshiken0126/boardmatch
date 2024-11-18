'use client'

import React from 'react'
import { Switch } from "@/components/ui/switch"

const GameItem = ({ game, onToggle }) => {
  return (
    (<li className="flex items-center space-x-4 py-2">
      <img
        src={game.image}
        alt={game.name}
        className="w-12 h-12 rounded-full object-cover" />
      <div className="flex-1">
        <h3 className="font-medium">{game.name}</h3>
        <p className="text-sm text-muted-foreground">{game.players}</p>
      </div>
      <Switch
        id={`game-switch-${game.id}`}
        checked={game.isWanted}
        onCheckedChange={() => onToggle(game.id)} />
    </li>)
  );
}

export default GameItem