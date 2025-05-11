"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createDrone, CreateDroneInput } from "@/lib/api";
import {
  droneTypeEnum,
  payloadTypeEnum,
  DroneType,
  PayloadType,
} from "@/lib/types";

type FormValues = z.infer<typeof formSchema>;

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(droneTypeEnum.enumValues),
  rangeKm: z.coerce.number().min(1),
  totalAvailable: z.coerce.number().min(1),
  flightTimeMin: z.coerce.number().min(1),
  exampleUseCase: z.string().min(10, "Use case must be at least 10 characters"),
  payloadType: z.enum(payloadTypeEnum.enumValues),
  image: z.string().optional(),
});

export function AddDroneDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "nano",
      rangeKm: 10,
      totalAvailable: 1,
      flightTimeMin: 30,
      exampleUseCase: "",
      payloadType: "camera",
      image: "",
    },
  });

  async function onSubmit(values: FormValues) {
    const result = await createDrone(values as CreateDroneInput);

    if (result.success) {
      toast("Drone added successfully", {
        description: "Drone added",
      });
      queryClient.invalidateQueries({ queryKey: ["drones"] });
      setOpen(false);
      form.reset();
    } else {
      toast("Error", {
        description: "Error",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Drone</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Drone</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Drone name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select drone type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {droneTypeEnum.enumValues.map((type: DroneType) => (
                        <SelectItem key={type} value={type}>
                          {type.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rangeKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Range (km)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="flightTimeMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flight Time (min)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="totalAvailable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Available</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payloadType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payload Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payload type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {payloadTypeEnum.enumValues.map((type: PayloadType) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="exampleUseCase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Use Case</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the use case" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Image URL (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Add Drone
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
