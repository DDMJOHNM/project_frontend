// Sample mental health counsellor data for seeding the vector database

import { Practitioner } from "./types";

export const samplePractitioners: Practitioner[] = [
  {
    id: "prac-001",
    name: "Sarah Johnson, MA, LPC",
    title: "Licensed Professional Counsellor",
    specialties: ["General Counselling", "Anxiety", "Depression", "Life Transitions"],
    expertise: `Sarah specializes in general mental health counselling using person-centered and 
    cognitive-behavioral approaches. She has extensive experience helping clients with anxiety, 
    depression, stress management, and life transitions. Sarah creates a safe, non-judgmental 
    space for clients to explore their feelings and develop coping strategies. She works with 
    adults and young adults dealing with everyday stressors, relationship issues, and personal growth.`,
    contact: {
      phone: "+64-9-555-0101",
      email: "sarah.johnson@positivethought.co.nz",
      address: "123 Queen St, Auckland CBD, Auckland"
    },
    availability: "Mon-Fri 9AM-5PM",
    acceptingNewClients: true
  },
  {
    id: "prac-002",
    name: "Michael Chen, PhD",
    title: "Clinical Psychologist",
    specialties: ["Trauma", "PTSD", "Complex Trauma", "EMDR Therapy"],
    expertise: `Dr. Chen is a clinical psychologist specializing in trauma-focused therapy. 
    He has extensive training in EMDR (Eye Movement Desensitization and Reprocessing), trauma-focused 
    CBT, and somatic experiencing. Michael works with clients who have experienced various forms of 
    trauma including childhood trauma, abuse, accidents, and PTSD. He uses evidence-based approaches 
    to help clients process traumatic memories and develop resilience. Experienced in working with 
    first responders, veterans, and survivors of violence.`,
    contact: {
      phone: "+64-9-555-0102",
      email: "michael.chen@positivethought.co.nz",
      address: "456 Ponsonby Rd, Ponsonby, Auckland"
    },
    availability: "Mon-Thu 8AM-6PM, Fri 8AM-2PM",
    acceptingNewClients: true
  },
  {
    id: "prac-003",
    name: "Emily Rodriguez, MSW, LCSW",
    title: "Licensed Clinical Social Worker",
    specialties: ["Grief Counselling", "Bereavement", "Loss", "End-of-Life Issues"],
    expertise: `Emily specializes in grief and bereavement counselling, helping clients navigate 
    the complex emotions that come with loss. She has extensive experience supporting people through 
    death of loved ones, relationship endings, job loss, and other significant life losses. Emily uses 
    a compassionate, client-centered approach incorporating narrative therapy and meaning-making. She 
    also works with anticipatory grief, complicated grief, and supports families dealing with terminal 
    illness. Experienced in both individual and group grief support.`,
    contact: {
      phone: "+64-9-555-0103",
      email: "emily.rodriguez@positivethought.co.nz",
      address: "789 Dominion Rd, Mt Eden, Auckland"
    },
    availability: "Mon-Fri 9AM-5PM",
    acceptingNewClients: true
  },
  {
    id: "prac-004",
    name: "James Wilson, MA, LMFT",
    title: "Licensed Marriage and Family Therapist",
    specialties: ["Couples Therapy", "Marriage Counselling", "Family Therapy", "Relationship Issues"],
    expertise: `James is a licensed marriage and family therapist specializing in relationship counselling. 
    He works with couples experiencing communication difficulties, trust issues, infidelity recovery, 
    and considering separation or divorce. James uses Gottman Method, Emotionally Focused Therapy (EFT), 
    and solution-focused approaches. He also works with families navigating parenting challenges, blended 
    family dynamics, and intergenerational conflicts. Experienced in premarital counselling and helping 
    couples strengthen their relationships.`,
    contact: {
      phone: "+64-9-555-0104",
      email: "james.wilson@positivethought.co.nz",
      address: "321 Remuera Rd, Remuera, Auckland"
    },
    availability: "Tue-Sat 9AM-6PM",
    acceptingNewClients: true
  },
  {
    id: "prac-005",
    name: "Lisa Martinez, PsyD",
    title: "Licensed Psychologist - Addiction Specialist",
    specialties: ["Addiction Counselling", "Substance Abuse", "Behavioral Addictions", "Recovery Support"],
    expertise: `Dr. Martinez is a licensed psychologist specializing in addiction and recovery. 
    She works with clients struggling with alcohol addiction, drug dependence, gambling, and other 
    behavioral addictions. Lisa uses evidence-based approaches including CBT, Motivational Interviewing, 
    and relapse prevention strategies. She helps clients understand the root causes of their addiction, 
    develop coping skills, and build sustainable recovery plans. Experienced in supporting families 
    affected by addiction and co-occurring mental health disorders like depression and anxiety.`,
    contact: {
      phone: "+64-9-555-0105",
      email: "lisa.martinez@positivethought.co.nz",
      address: "555 Parnell Rd, Parnell, Auckland"
    },
    availability: "Mon-Wed 7AM-5PM, Thu 7AM-12PM",
    acceptingNewClients: true
  },
  {
    id: "prac-006",
    name: "Robert Kim, MA, LMHC",
    title: "Licensed Mental Health Counsellor",
    specialties: ["OCD", "Anxiety Disorders", "Panic Attacks", "Phobias"],
    expertise: `Robert specializes in anxiety disorders and OCD using evidence-based treatments. 
    He is extensively trained in Exposure and Response Prevention (ERP), the gold standard for OCD 
    treatment, as well as CBT for anxiety and panic disorders. Robert helps clients with obsessive 
    thoughts, compulsive behaviors, panic attacks, social anxiety, specific phobias, and generalized 
    anxiety. He uses a structured, collaborative approach to help clients gradually face their fears 
    and reduce anxiety symptoms. Experienced in both individual therapy and intensive treatment programs.`,
    contact: {
      phone: "+64-9-555-0106",
      email: "robert.kim@positivethought.co.nz",
      address: "888 New North Rd, Kingsland, Auckland"
    },
    availability: "Mon-Fri 8AM-5PM",
    acceptingNewClients: true
  },
  {
    id: "prac-007",
    name: "Amanda Foster, PhD, RPsych",
    title: "Registered Psychologist - Child & Adolescent Specialist",
    specialties: ["Child Psychology", "Adolescent Therapy", "ADHD", "School Issues"],
    expertise: `Dr. Foster specializes in child and adolescent mental health. She works with 
    children and teens experiencing behavioral issues, ADHD, anxiety, depression, school-related 
    stress, and developmental challenges. Amanda uses play therapy for younger children and 
    talk therapy for adolescents, incorporating CBT and family therapy approaches. She helps 
    with bullying, peer relationships, academic stress, self-esteem issues, and emotional regulation. 
    Experienced in parent coaching and working with schools to support children's mental health. 
    Also provides psychological assessments for learning difficulties and ADHD.`,
    contact: {
      phone: "+64-9-555-0107",
      email: "amanda.foster@positivethought.co.nz",
      address: "999 Great North Rd, Grey Lynn, Auckland"
    },
    availability: "Mon-Fri 8AM-4PM, Sat 9AM-1PM",
    acceptingNewClients: true
  }
];
