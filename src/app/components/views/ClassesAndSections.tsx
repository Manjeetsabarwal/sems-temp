import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ClassesAPI } from './ClassesAPI';
import { SectionsAPI } from './SectionsAPI';
import { ClassSectionMatrix } from './ClassSectionMatrix';

export function ClassesAndSections() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="classes" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="matrix">Combinations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="classes" className="mt-6">
          <ClassesAPI />
        </TabsContent>
        
        <TabsContent value="sections" className="mt-6">
          <SectionsAPI />
        </TabsContent>
        
        <TabsContent value="matrix" className="mt-6">
          <ClassSectionMatrix />
        </TabsContent>
      </Tabs>
    </div>
  );
}
