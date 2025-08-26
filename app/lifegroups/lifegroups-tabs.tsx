'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/patterns/empty-state";
import { LifeGroupCard } from "./lifegroup-card";
import { Users } from "lucide-react";

interface LifeGroupsTabsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  myGroups: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  availableGroups: any[]
  isAdmin: boolean
}

export function LifeGroupsTabs({ myGroups, availableGroups, isAdmin }: LifeGroupsTabsProps) {
  return (
    <Tabs defaultValue="my-groups" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="my-groups">
          My Groups ({myGroups.length})
        </TabsTrigger>
        <TabsTrigger value="available">
          Available Groups ({availableGroups.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="my-groups" className="space-y-4">
        {myGroups.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="Not in any groups yet"
            description="Join a life group to connect with others"
            action={{
              label: "Browse Available Groups",
              onClick: () => {
                const trigger = document.querySelector('[value="available"]') as HTMLButtonElement;
                trigger?.click();
              }
            }}
          />
        ) : (
          <div className="card-grid">
            {myGroups.map((membership) => (
              <LifeGroupCard
                key={membership.lifeGroup.id}
                lifeGroup={membership.lifeGroup}
                isMember={true}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="available" className="space-y-4">
        {availableGroups.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No groups available"
            description="All groups are either full or you're already a member"
            action={isAdmin ? {
              label: "Create New Group",
              href: "/admin/lifegroups"
            } : undefined}
          />
        ) : (
          <div className="card-grid">
            {availableGroups.map((group) => (
              <LifeGroupCard
                key={group.id}
                lifeGroup={group}
                isMember={false}
                hasPendingRequest={group.hasPendingRequest}
                isFull={group.isFull}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}